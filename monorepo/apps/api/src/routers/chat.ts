import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";
import { CreateChatInput } from "../dtos/chat";
import { authMiddleware } from "../middleware/auth";

export const chatRouter = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

chatRouter.get("/", async (c) => {
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
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Explain me AI in 2 paragraph",
        },
      ],
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

  const transformerFinal = {
    transform(chunk: any, controller: TransformStreamDefaultController) {
      const delta = chunk?.choices?.[0]?.delta.content;
      if (delta) {
        console.log(delta);
        controller.enqueue(`data: ${delta}\n\n`);
      }
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

chatRouter.use("/", authMiddleware);
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
      name: "New chat",
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

chatRouter.use("/:id", authMiddleware);
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
