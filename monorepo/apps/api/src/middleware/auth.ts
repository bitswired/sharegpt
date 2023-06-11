import jwt from "@tsndr/cloudflare-worker-jwt";
import { Context, Next } from "hono";

import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  // Extract bearer token from authorization header
  const token = c.req.headers.get("authorization")?.split(" ")[1] ?? "";
  // Verify token
  const isOk = await jwt.verify(token, c.env.SECRET);

  const { payload } = jwt.decode(token);

  const dbClient = c.get("dbClient");

  const user = await dbClient
    .selectFrom("user")
    .selectAll()
    .where("id", "=", payload.id)
    .executeTakeFirstOrThrow();

  if (!isOk || !user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  c.set("user", user as any);

  await next();
}
