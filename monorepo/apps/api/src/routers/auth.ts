import { Hono } from "hono";

import { Kysely } from "kysely";
import type { DB } from "kysely-codegen";
import { D1Dialect } from "kysely-d1";

import { LoginInput, SignupInput } from "../dtos/auth";

import jwt from "@tsndr/cloudflare-worker-jwt";
import { HTTPException } from "hono/http-exception";
import { Bindings, Variables } from "../bindings";
import { authMiddleware } from "../middleware/auth";

export const authRouter = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

authRouter.use("/me", authMiddleware());
authRouter.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const { name } = user;

  return c.json({ name });
});

authRouter.post("/login", async (c) => {
  const input = LoginInput.parse(await c.req.json());

  const client = new Kysely<DB>({
    dialect: new D1Dialect({ database: c.env.DB }),
  });

  const user = await client
    .selectFrom("user")
    .selectAll()
    .where("name", "=", input.name)
    .executeTakeFirst();

  console.log(user);

  if (!user) {
    throw new HTTPException(401, { message: "USer not found" });
  }

  if (user.password !== input.password || !user.id) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const token = await jwt.sign(
    {
      id: user.id,
      exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // Expires: Now + 2h
    },
    c.env.SECRET
  );

  return c.json({ token });
});

authRouter.post("/signup", async (c) => {
  const input = SignupInput.parse(await c.req.json());

  if (input.secret !== c.env.SECRET) {
    throw new HTTPException(401, { message: "Invalid Secret" });
  }

  const client = new Kysely<DB>({
    dialect: new D1Dialect({ database: c.env.DB }),
  });

  const x = await client
    .selectFrom("user")
    .selectAll()
    .where("name", "=", input.name)
    .executeTakeFirst();

  if (x) {
    throw new HTTPException(422, { message: "Name already used" });
  }

  const res = await client
    .insertInto("user")
    .values({
      name: input.name,
      password: input.password,
    })
    .returning("id")
    .executeTakeFirst();

  if (!res) {
    throw new HTTPException(500, { message: "Something went wrong" });
  }

  return c.json({ message: `User created, id: ${res?.id}` });
});

authRouter.use("/logout", authMiddleware());
authRouter.post("/logout", async (c) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  const token = c.req.headers.get("authorization")?.split(" ")[1];

  await c.env.SHAREGPTKV.put(`token/evicted/${token}`, `${Date.now()}`, {
    expirationTtl: 60 * 60 * 2,
  });

  return c.json({ message: "Logged out" });
});
