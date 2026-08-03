import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { convertLegacyHtml } from "../lib/content";

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or NEON_DATABASE_URL is required.");
  const sql = neon(connectionString);

  const migration = await readFile(join(process.cwd(), "drizzle/0000_draftline_foundation.sql"), "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement, []);
  }

  const legacyPosts = await sql`SELECT "id", "title", "content" FROM "blog" WHERE jsonb_array_length("contentJson") = 0`;
  const failures: { id: string; reason: string }[] = [];

  for (const post of legacyPosts) {
    try {
      const converted = await convertLegacyHtml(String(post.content ?? ""), String(post.title ?? ""));
      await sql`
      UPDATE "blog" SET
        "contentJson" = ${JSON.stringify(converted.blocks)}::jsonb,
        "contentHtml" = ${converted.html},
        "content" = ${converted.html},
        "contentText" = ${converted.text},
        "excerpt" = CASE WHEN "excerpt" = '' THEN ${converted.excerpt} ELSE "excerpt" END,
        "readingTimeMinutes" = ${converted.readingTimeMinutes},
        "updatedAt" = now()
      WHERE "id" = ${post.id}
      `;
    } catch (error) {
      failures.push({ id: String(post.id), reason: error instanceof Error ? error.message : "Unknown conversion error" });
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ failures }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Draftline migration complete. Converted ${legacyPosts.length} legacy stories.`);
  }
}

void main();
