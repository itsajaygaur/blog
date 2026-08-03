import type { Block } from "@blocknote/core";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};

// Kept intact for a rollback window. The modern app reads auth_* tables.
export const legacyUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const legacyAccounts = pgTable(
  "account",
  {
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const authUsers = pgTable(
  "auth_user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    image: text("image"),
    handle: text("handle").notNull().unique(),
    bio: text("bio").default("").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("auth_user_handle_idx").on(table.handle)],
);

export const authSessions = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" })
      .notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("auth_session_user_idx").on(table.userId)],
);

export const authAccounts = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("auth_account_provider_idx").on(
      table.providerId,
      table.accountId,
    ),
    index("auth_account_user_idx").on(table.userId),
  ],
);

export const authVerifications = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" })
      .notNull(),
    ...timestamps,
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const postStatus = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

export const posts = pgTable(
  "blog",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull().default("Untitled story"),
    content: text("content").notNull().default(""), // Legacy HTML for rollback.
    userId: text("userId").notNull(), // Legacy author id for rollback.
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    authorId: text("authorId").references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    excerpt: text("excerpt").notNull().default(""),
    contentJson: jsonb("contentJson").$type<Block[]>().notNull().default([]),
    contentHtml: text("contentHtml").notNull().default(""),
    contentText: text("contentText").notNull().default(""),
    coverImageUrl: text("coverImageUrl"),
    coverImageAlt: text("coverImageAlt"),
    status: postStatus("status").notNull().default("draft"),
    readingTimeMinutes: integer("readingTimeMinutes").notNull().default(1),
    publishedAt: timestamp("publishedAt", {
      withTimezone: true,
      mode: "date",
    }),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    index("post_author_status_idx").on(table.authorId, table.status),
    index("post_published_at_idx").on(table.status, table.publishedAt),
  ],
);

export const tags = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ...timestamps,
  },
  (table) => [uniqueIndex("tag_slug_idx").on(table.slug)],
);

export const postTags = pgTable(
  "post_tag",
  {
    postId: text("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tag_tag_idx").on(table.tagId),
  ],
);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    ownerId: text("ownerId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    postId: text("postId").references(() => posts.id, {
      onDelete: "set null",
    }),
    pathname: text("pathname").notNull().unique(),
    url: text("url").notNull().unique(),
    contentType: text("contentType").notNull(),
    size: integer("size").notNull(),
    altText: text("altText").notNull().default(""),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("media_owner_post_idx").on(table.ownerId, table.postId)],
);

export type Post = typeof posts.$inferSelect;
export type Author = typeof authUsers.$inferSelect;
export type Tag = typeof tags.$inferSelect;

// Compatibility alias for older imports while migration code is being removed.
export const blogs = posts;
export type Blog = Post;
