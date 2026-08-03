-- Additive, rollback-safe Draftline migration. Legacy auth and post columns remain intact.
CREATE TABLE IF NOT EXISTS "draftline_backup_user_20260803" AS TABLE "user";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "draftline_backup_account_20260803" AS TABLE "account";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "draftline_backup_blog_20260803" AS TABLE "blog";--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."post_status" AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "auth_user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean DEFAULT false NOT NULL,
  "image" text,
  "handle" text NOT NULL UNIQUE,
  "bio" text DEFAULT '' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint

INSERT INTO "auth_user" ("id", "name", "email", "emailVerified", "image", "handle")
SELECT
  "id",
  COALESCE(NULLIF(BTRIM("name"), ''), SPLIT_PART("email", '@', 1), 'Writer'),
  "email",
  ("emailVerified" IS NOT NULL),
  "image",
  LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(NULLIF(BTRIM("name"), ''), SPLIT_PART("email", '@', 1))), '[^a-z0-9]+', '-', 'g')), 23) || '-' || LEFT(REPLACE("id", '-', ''), 4)
FROM "user"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "auth_account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "auth_user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL,
  UNIQUE ("providerId", "accountId")
);--> statement-breakpoint

INSERT INTO "auth_account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "scope")
SELECT
  MD5("provider" || ':' || "providerAccountId"),
  "providerAccountId",
  "provider",
  "userId",
  "access_token",
  "refresh_token",
  "id_token",
  CASE WHEN "expires_at" IS NULL THEN NULL ELSE TO_TIMESTAMP("expires_at") END,
  "scope"
FROM "account"
ON CONFLICT ("providerId", "accountId") DO NOTHING;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "auth_session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "auth_user"("id") ON DELETE CASCADE,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "auth_verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "authorId" text;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "excerpt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "contentJson" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "contentHtml" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "contentText" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "coverImageUrl" text;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "coverImageAlt" text;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "status" post_status DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "readingTimeMinutes" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "publishedAt" timestamptz;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint

UPDATE "blog" SET
  "title" = COALESCE(NULLIF(BTRIM("title"), ''), 'Untitled story'),
  "content" = COALESCE("content", ''),
  "slug" = COALESCE(NULLIF(BTRIM("slug"), ''), 'story-' || LEFT(REPLACE("id", '-', ''), 8)),
  "createdAt" = COALESCE("createdAt", now()),
  "authorId" = "userId",
  "contentHtml" = COALESCE(NULLIF("contentHtml", ''), "content", ''),
  "status" = 'published',
  "publishedAt" = COALESCE("publishedAt", "createdAt", now()),
  "updatedAt" = COALESCE("updatedAt", "createdAt", now());--> statement-breakpoint

ALTER TABLE "blog" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog' AND column_name = 'createdAt' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE "blog" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "blog" ADD CONSTRAINT "blog_authorId_auth_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "auth_user"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tag" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "post_tag" (
  "postId" text NOT NULL REFERENCES "blog"("id") ON DELETE CASCADE,
  "tagId" text NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("postId", "tagId")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "media" (
  "id" text PRIMARY KEY NOT NULL,
  "ownerId" text NOT NULL REFERENCES "auth_user"("id") ON DELETE CASCADE,
  "postId" text REFERENCES "blog"("id") ON DELETE SET NULL,
  "pathname" text NOT NULL UNIQUE,
  "url" text NOT NULL UNIQUE,
  "contentType" text NOT NULL,
  "size" integer NOT NULL,
  "altText" text DEFAULT '' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_handle_idx" ON "auth_user" ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_account_provider_idx" ON "auth_account" ("providerId", "accountId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_account_user_idx" ON "auth_account" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_session_user_idx" ON "auth_session" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_verification_identifier_idx" ON "auth_verification" ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_author_status_idx" ON "blog" ("authorId", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_published_at_idx" ON "blog" ("status", "publishedAt" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_search_idx" ON "blog" USING gin (to_tsvector('english', COALESCE("title", '') || ' ' || COALESCE("excerpt", '') || ' ' || COALESCE("contentText", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_owner_post_idx" ON "media" ("ownerId", "postId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_tag_tag_idx" ON "post_tag" ("tagId");
