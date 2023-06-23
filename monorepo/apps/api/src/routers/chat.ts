import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";
import { AppendHumanMessageInput, CreateChatInput } from "../dtos/chat";
import { authMiddleware } from "../middleware/auth";

export const chatRouter = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

chatRouter.use("/sse", authMiddleware("query"));
chatRouter.get("/sse", async (c) => {
  const user = c.get("user");
  const dbClient = c.get("dbClient");
  const chatId = c.req.query("chatId");

  if (!user?.id) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  if (!chatId) {
    throw new HTTPException(400, { message: "Chat id not provided" });
  }

  const rateLimiterId = c.env.RATE_LIMITER.idFromName(user.id.toString());
  const rateLimiter = c.env.RATE_LIMITER.get(rateLimiterId);
  // acquire a lock
  const lock = await rateLimiter.fetch("https://dummy/generation", {
    method: "POST",
  });

  if (!lock.ok) {
    if (lock.status === 429) {
      console.log("RATE LIMITED");
      throw new HTTPException(429, { message: "Too many requests" });
    } else {
      console.log(`HTTP error! status: ${lock.status} ${lock.statusText}`);
      throw new Error(`HTTP error! status: ${lock.status} ${lock.statusText}`);
    }
  }
  console.log("LOCKED");

  const messages = await dbClient
    .selectFrom("message")
    .selectAll()
    .where("chat_id", "=", parseInt(chatId))
    .orderBy("created_at", "asc")
    .execute();

  console.log("Start");
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      stream: true,
      model: "gpt-3.5-turbo",
      messages: messages.map((m) => ({
        role: m.type === "human" ? "user" : "assistant",
        content: m.text,
      })),
    }),
  };
  const res = await fetch(apiUrl, fetchOptions);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  if (!res.body) throw new Error("No response body");

  // Create a TransformStream with a transformer
  let acc = "";
  const transformer = {
    transform(chunk: string, controller: TransformStreamDefaultController) {
      // Call the processing function on the chunk of data
      acc += chunk;
      let lastIndex = 0;

      const regex = /{"id".*?\]}/g;
      let match;
      while ((match = regex.exec(acc)) !== null) {
        const jsonString = match[0];
        try {
          const jsonData = JSON.parse(jsonString);
          controller.enqueue(jsonData);
          lastIndex = match.index + match[0].length;
        } catch (error) {}
      }

      acc = acc.slice(lastIndex);
    },
  };

  let message = "";
  const transformerFinal: Transformer = {
    transform(chunk: any, controller: TransformStreamDefaultController) {
      const delta = chunk?.choices?.[0]?.delta.content;
      if (delta) {
        console.log(delta);
        message += delta;
        controller.enqueue(`data: ${delta}\n\n`);
      }
    },

    async flush(controller: TransformStreamDefaultController) {
      console.log("FLUSH");
      console.log(message);

      const m = await dbClient
        .insertInto("message")
        .values({
          chat_id: parseInt(chatId),
          user_id: user?.id,
          text: message,
          type: "ai",
          created_at: new Date().toISOString(),
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      const unlock = await rateLimiter.fetch(
        "https://dummy/generation/unlock",
        {
          method: "POST",
        }
      );

      if (!unlock.ok) {
        console.log(
          `HTTP error! status: ${unlock.status} ${unlock.statusText}`
        );
        throw new HTTPException(500, { message: "Unlock failed" });
      }
      console.log("UNLOCKED");
    },
  };

  // Create a TransformStream with the transformer
  const transformStream = new TransformStream(transformer);
  const transformStreamFinal = new TransformStream(transformerFinal);

  // Pipe the fetch stream through the transform stream
  const processedReadable = res.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(transformStream)
    .pipeThrough(transformStreamFinal)
    .pipeThrough(new TextEncoderStream());

  // Return a new Response object with the processed readable stream
  return new Response(processedReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

chatRouter.put("/", authMiddleware());
chatRouter.put("/", async (c) => {
  const input = AppendHumanMessageInput.parse(await c.req.json());

  const dbClient = c.get("dbClient");
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chat = await dbClient
    .selectFrom("chat")
    .where("id", "=", input.chatId)
    .selectAll()
    .executeTakeFirstOrThrow();

  if (!chat.id) {
    throw new HTTPException(500, { message: "Chat not created" });
  }

  const message = await dbClient
    .insertInto("message")
    .values({
      chat_id: chat.id,
      user_id: user.id,
      text: input.message,
      type: "human",
      created_at: new Date().toISOString(),
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return c.json({ messageId: chat.id });
});

chatRouter.use("/", authMiddleware());
chatRouter.post("/", async (c) => {
  const input = CreateChatInput.parse(await c.req.json());

  const dbClient = c.get("dbClient");
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chat = await dbClient
    .insertInto("chat")
    .values({
      name: input.message.slice(0, 20) + " ...",
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  if (!chat.id) {
    throw new HTTPException(500, { message: "Chat not created" });
  }

  const message = await dbClient
    .insertInto("message")
    .values({
      chat_id: chat.id,
      user_id: user.id,
      text: input.message,
      type: "human",
      created_at: new Date().toISOString(),
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return c.json({ chatId: chat.id });
});

chatRouter.use("/:id", authMiddleware());
chatRouter.get("/:id", async (c) => {
  const dbClient = c.get("dbClient");
  const user = c.get("user");

  const chatId = c.req.param("id");

  console.log("JDIDIDIDIDI");

  console.log(user);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chat = await dbClient
    .selectFrom("chat")
    .selectAll()
    .where("id", "=", parseInt(chatId))
    .selectAll()
    .executeTakeFirst();
  if (!chat) {
    throw new HTTPException(404, { message: "Chat not found" });
  }

  const messages = await dbClient
    .selectFrom("message")
    .selectAll()
    .where("chat_id", "=", parseInt(chatId))
    .orderBy("created_at", "asc")
    .execute();

  return c.json({ chat, messages });
});

chatRouter.use("/", authMiddleware());
chatRouter.get("/", async (c) => {
  const dbClient = c.get("dbClient");
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chats = await dbClient
    .selectFrom("chat")
    .selectAll()
    .where("user_id", "=", user.id)
    .orderBy("created_at", "desc")
    .selectAll()
    .execute();

  return c.json({ chats });
});

chatRouter.use("/:id", authMiddleware());
chatRouter.delete("/:id", async (c) => {
  const dbClient = c.get("dbClient");
  const user = c.get("user");

  const chatId = c.req.param("id");

  console.log("JDIDIDIDIDI");

  console.log(user);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chat = await dbClient
    .selectFrom("chat")
    .selectAll()
    .where("id", "=", parseInt(chatId))
    .selectAll()
    .executeTakeFirst();
  if (!chat) {
    throw new HTTPException(404, { message: "Chat not found" });
  }

  await dbClient
    .deleteFrom("message")
    .where("chat_id", "=", parseInt(chatId))
    .execute();

  const deletedChat = await dbClient
    .deleteFrom("chat")
    .where("id", "=", parseInt(chatId))
    .returning("id")
    .executeTakeFirstOrThrow();

  return c.json({ chatId: deletedChat.id });
});
