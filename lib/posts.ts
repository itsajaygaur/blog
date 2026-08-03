import "server-only";
import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  inArray,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/drizzle";
import { authUsers, posts, postTags, tags } from "@/db/schema";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { searchSchema } from "@/lib/validation";

export type StoryCard = Awaited<ReturnType<typeof listPublishedStories>>["stories"][number];

async function tagMap(postIds: string[]) {
  if (!postIds.length) return new Map<string, { name: string; slug: string }[]>();

  const rows = await getDb()
    .select({ postId: postTags.postId, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds))
    .orderBy(asc(tags.name));

  return rows.reduce((map, row) => {
    const current = map.get(row.postId) ?? [];
    current.push({ name: row.name, slug: row.slug });
    map.set(row.postId, current);
    return map;
  }, new Map<string, { name: string; slug: string }[]>());
}

export async function listPublishedStories(input: {
  q?: string;
  tag?: string;
  page?: number | string;
} = {}) {
  const { q, tag, page } = searchSchema.parse(input);
  const database = getDb();
  const conditions = [eq(posts.status, "published")];

  if (q) {
    conditions.push(
      sql`to_tsvector('english', coalesce(${posts.title}, '') || ' ' || coalesce(${posts.excerpt}, '') || ' ' || coalesce(${posts.contentText}, '')) @@ websearch_to_tsquery('english', ${q})`,
    );
  }

  if (tag) {
    conditions.push(
      exists(
        database
          .select({ value: sql`1` })
          .from(postTags)
          .innerJoin(tags, eq(tags.id, postTags.tagId))
          .where(and(eq(postTags.postId, posts.id), eq(tags.slug, tag))),
      ),
    );
  }

  const where = and(...conditions);
  const [rows, totalResult] = await Promise.all([
    database
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        coverImageUrl: posts.coverImageUrl,
        coverImageAlt: posts.coverImageAlt,
        readingTimeMinutes: posts.readingTimeMinutes,
        publishedAt: posts.publishedAt,
        author: {
          name: authUsers.name,
          handle: authUsers.handle,
          image: authUsers.image,
        },
      })
      .from(posts)
      .innerJoin(authUsers, eq(posts.authorId, authUsers.id))
      .where(where)
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset((page - 1) * POSTS_PER_PAGE),
    database.select({ value: count() }).from(posts).where(where),
  ]);
  const tagsByPost = await tagMap(rows.map((row) => row.id));

  return {
    stories: rows.map((row) => ({ ...row, tags: tagsByPost.get(row.id) ?? [] })),
    total: totalResult[0]?.value ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((totalResult[0]?.value ?? 0) / POSTS_PER_PAGE)),
    query: q,
    tag,
  };
}

export const getPublishedStory = cache(async (slug: string) => {
  const rows = await getDb()
    .select({
      post: posts,
      author: {
        id: authUsers.id,
        name: authUsers.name,
        handle: authUsers.handle,
        image: authUsers.image,
        bio: authUsers.bio,
      },
    })
    .from(posts)
    .innerJoin(authUsers, eq(posts.authorId, authUsers.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const tagsByPost = await tagMap([row.post.id]);
  return { ...row, tags: tagsByPost.get(row.post.id) ?? [] };
});

export async function getRelatedStories(postId: string, authorId: string) {
  return getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      readingTimeMinutes: posts.readingTimeMinutes,
    })
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        eq(posts.authorId, authorId),
        sql`${posts.id} <> ${postId}`,
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(3);
}

export const getAuthorProfile = cache(async (handle: string) => {
  const author = await getDb().query.authUsers.findFirst({
    where: eq(authUsers.handle, handle),
  });
  if (!author) return null;

  const authoredPosts = await getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImageUrl: posts.coverImageUrl,
      coverImageAlt: posts.coverImageAlt,
      readingTimeMinutes: posts.readingTimeMinutes,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, author.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt));

  return { author, stories: authoredPosts };
});

export async function getPopularTags() {
  return getDb()
    .select({ name: tags.name, slug: tags.slug, count: count(postTags.postId) })
    .from(tags)
    .innerJoin(postTags, eq(tags.id, postTags.tagId))
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(eq(posts.status, "published"))
    .groupBy(tags.id)
    .orderBy(desc(count(postTags.postId)), asc(tags.name))
    .limit(8);
}

export async function getStudioData(userId: string) {
  const rows = await getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      status: posts.status,
      updatedAt: posts.updatedAt,
      publishedAt: posts.publishedAt,
      readingTimeMinutes: posts.readingTimeMinutes,
      version: posts.version,
    })
    .from(posts)
    .where(eq(posts.authorId, userId))
    .orderBy(desc(posts.updatedAt));

  return {
    stories: rows,
    counts: {
      draft: rows.filter((post) => post.status === "draft").length,
      published: rows.filter((post) => post.status === "published").length,
      archived: rows.filter((post) => post.status === "archived").length,
    },
  };
}

export async function getOwnedPost(id: string, userId: string) {
  const post = await getDb().query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.authorId, userId)),
  });
  if (!post) return null;
  const tagsByPost = await tagMap([post.id]);
  return { ...post, tags: tagsByPost.get(post.id)?.map((tag) => tag.name) ?? [] };
}
