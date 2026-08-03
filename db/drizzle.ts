import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.NEON_DATABASE_URL ??
    "postgresql://draftline:build-only@localhost/draftline";

  return drizzle(neon(connectionString), { schema });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  database ??= createDb();
  return database;
}

export default getDb;
