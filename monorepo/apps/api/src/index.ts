import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routers/auth";

const app = new Hono<{ Bindings: Bindings }>();
app.use("/*", cors());

app.get("/", (c) => c.text("Hello Hono!"));

app.route("/auth", authRouter);

export default app;
