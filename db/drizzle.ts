import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const BUILD_DATABASE_URL = "postgresql://draftline:build-only@localhost/draftline";

type DatabaseEnvironment = { DATABASE_URL?: string; NEON_DATABASE_URL?: string };

export function resolveDatabaseUrl(
  environment: DatabaseEnvironment = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  },
) {
  return environment.DATABASE_URL?.trim() || environment.NEON_DATABASE_URL?.trim() || BUILD_DATABASE_URL;
}

function createDb() {
  return drizzle(neon(resolveDatabaseUrl()), { schema });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  database ??= createDb();
  return database;
}

export default getDb;
