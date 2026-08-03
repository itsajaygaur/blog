import { neon } from "@neondatabase/serverless";

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or NEON_DATABASE_URL is required.");
  const sql = neon(connectionString);

  const [integrity] = await sql`
  SELECT
    (SELECT count(*)::int FROM "blog") AS posts,
    (SELECT count(*)::int FROM "auth_user") AS users,
    (SELECT count(*)::int FROM "auth_account") AS accounts,
    (SELECT count(*)::int FROM "blog" WHERE "authorId" IS NULL) AS missing_authors,
    (SELECT count(*)::int FROM "blog" WHERE jsonb_array_length("contentJson") = 0) AS missing_content,
    (SELECT count(*)::int FROM "blog" b LEFT JOIN "auth_user" u ON u.id = b."authorId" WHERE u.id IS NULL) AS orphan_posts
  `;

  console.log(JSON.stringify(integrity, null, 2));
  if (integrity.missing_authors || integrity.missing_content || integrity.orphan_posts) process.exitCode = 1;
}

void main();
