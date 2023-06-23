import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings, Variables } from "./bindings";
import { dbMiddleware } from "./middleware/db";
import { authRouter } from "./routers/auth";
import { chatRouter } from "./routers/chat";
import { liveRouter } from "./routers/live";

export { ChatRoom } from "./durable-objects/chat";
export { RateLimiter } from "./durable-objects/rate-limiter";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/*", dbMiddleware);

app.get("/", (c) => c.text("Hello Hono!"));

app.route("/live", liveRouter);

app.use("/auth/*", cors());
app.route("/auth", authRouter);

app.use("/chat/*", cors());
app.route("/chat", chatRouter);

export default app;
