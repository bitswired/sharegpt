-- Migration number: 0001 	 2023-06-10T21:08:57.072Z

-- SQLite dialiect

CREATE TABLE IF NOT EXISTS "chat" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "user" ("id")
);

CREATE TABLE IF NOT EXISTS "message" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "chat_id" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL,
  FOREIGN KEY ("chat_id") REFERENCES "chat" ("id"),
  FOREIGN KEY ("user_id") REFERENCES "user" ("id")
);

