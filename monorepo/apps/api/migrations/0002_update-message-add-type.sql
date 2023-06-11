-- Migration number: 0002 	 2023-06-10T23:18:10.559Z

-- SQLite dialiect

ALTER TABLE "message" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';