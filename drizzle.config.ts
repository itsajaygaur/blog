// import "dotenv/config";
import { cwd } from 'node:process';
import type {Config} from "drizzle-kit";

import { loadEnvConfig } from '@next/env'

loadEnvConfig(cwd());

export default {
  schema: "./db/schema.ts",
  // out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.NEON_DATABASE_URL!,
  },
} satisfies Config;