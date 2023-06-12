import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";
import { authMiddleware } from "../middleware/auth";

export const liveRouter = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

liveRouter.use("/", cors());
liveRouter.use("/", authMiddleware());
liveRouter.post("/", async (c) => {
  const user = c.get("user");
  const id = c.env.CHAT_ROOM.newUniqueId();
  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const chatRoom = c.env.CHAT_ROOM.get(id);

  let newUrl = new URL(c.req.url);
  newUrl.pathname = "/create";
  console.log(newUrl.toString());

  const x = await chatRoom.fetch(newUrl, {
    method: "POST",
    body: JSON.stringify({
      ownerName: user.name,
    }),
  });
  console.log(x);
  return c.json({ id: id.toString() });
});

liveRouter.use("/:id", authMiddleware("query"));
liveRouter.all("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const id = c.env.CHAT_ROOM.idFromString(c.req.param("id"));

  const chatRoom = c.env.CHAT_ROOM.get(id);
  console.log(id, chatRoom);
  let newUrl = new URL(c.req.url);
  newUrl.pathname = "/websocket";
  newUrl.searchParams.set("name", user.name);
  console.log(newUrl.toString());

  const x = await chatRoom.fetch(newUrl, c.req);

  console.log(JSON.stringify(x, null, 2));

  return x;
});
