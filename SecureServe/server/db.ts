import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema-sqlite";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use SQLite for local development
const dbPath = process.env.DATABASE_URL.replace('file:', '');
const sqlite = new Database(dbPath);
export const db = drizzle({ client: sqlite, schema });