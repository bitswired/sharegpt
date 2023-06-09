-- Migration number: 0000 	 2023-06-09T14:18:24.019Z

-- SQLite dialiect

CREATE TABLE IF NOT EXISTS "user" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "password" TEXT NOT NULL
);

