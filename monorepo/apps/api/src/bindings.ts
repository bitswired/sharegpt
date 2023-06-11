import type { Kysely } from "kysely";
import type { DB } from "kysely-codegen";

export type Variables = {
  user: { id: number; name: string; password: string } | null;
  dbClient: Kysely<DB>;
};

export type Bindings = {
  DB: D1Database;
  SECRET: string;
  OPENAI_API_KEY: string;
};
