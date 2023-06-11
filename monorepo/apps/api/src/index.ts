import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings, Variables } from "./bindings";
import { dbMiddleware } from "./middleware/db";
import { authRouter } from "./routers/auth";
import { chatRouter } from "./routers/chat";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
app.use("/*", cors());
app.use("/*", dbMiddleware);

app.get("/", (c) => c.text("Hello Hono!"));

app.route("/auth", authRouter);
app.route("/chat", chatRouter);

export default app;
