import { Context, Next } from "hono";

import { Kysely } from "kysely";
import type { DB } from "kysely-codegen";
import { D1Dialect } from "kysely-d1";

import { Bindings, Variables } from "../bindings";

export async function dbMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const client = new Kysely<DB>({
    dialect: new D1Dialect({ database: c.env.DB }),
  });

  c.set("dbClient", client);

  await next();
}
