import jwt from "@tsndr/cloudflare-worker-jwt";
import { Context, Next } from "hono";

import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";

export const authMiddleware =
  (mode: "bearer" | "query" = "bearer") =>
  async (
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
  ) => {
    try {
      // Extract bearer token from authorization header
      let token: string;
      if (mode === "bearer") {
        token = c.req.headers.get("authorization")?.split(" ")[1] ?? "";
      } else if (mode === "query") {
        token = c.req.query("token") ?? "";
      } else {
        throw new Error("Invalid mode");
      }

      const x = await c.env.SHAREGPTKV.get(`token/evicted/${token}`);
      if (x) {
        throw new HTTPException(401, { message: "Token evicted" });
      }

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
    } catch (e) {
      console.error(e);
      throw new HTTPException(401, { message: "Unauthorized" });
    }
  };
