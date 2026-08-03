import type { Block } from "@blocknote/core";
import { neon } from "@neondatabase/serverless";
import { processBlocks, removeDuplicateTitle } from "../lib/content";

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or NEON_DATABASE_URL is required.");
  const sql = neon(connectionString);
  const stories = await sql`SELECT "id", "title", "contentJson" FROM "blog"`;
  const failures: { id: string; reason: string }[] = [];

  for (const story of stories) {
    try {
      const blocks = removeDuplicateTitle(story.contentJson as Block[], String(story.title));
      const derived = await processBlocks(blocks);
      await sql`
        UPDATE "blog" SET
          "contentJson" = ${JSON.stringify(blocks)}::jsonb,
          "contentHtml" = ${derived.html},
          "content" = ${derived.html},
          "contentText" = ${derived.text},
          "excerpt" = ${derived.excerpt},
          "readingTimeMinutes" = ${derived.readingTimeMinutes},
          "updatedAt" = now()
        WHERE "id" = ${story.id}
      `;
    } catch (error) {
      failures.push({ id: String(story.id), reason: error instanceof Error ? error.message : "Unknown processing error" });
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ failures }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(`Reprocessed ${stories.length} Draftline stories.`);
}

void main();
