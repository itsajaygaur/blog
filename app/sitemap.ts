import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/drizzle";
import { authUsers, posts } from "@/db/schema";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    return [
      { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE_URL}/stories`, changeFrequency: "daily", priority: 0.9 },
    ];
  }
  const [stories, authors] = await Promise.all([
    getDb().select({ slug: posts.slug, updatedAt: posts.updatedAt }).from(posts).where(eq(posts.status, "published")),
    getDb().select({ handle: authUsers.handle, updatedAt: authUsers.updatedAt }).from(authUsers),
  ]);
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/stories`, changeFrequency: "daily", priority: 0.9 },
    ...stories.map((story) => ({ url: `${SITE_URL}/stories/${story.slug}`, lastModified: story.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...authors.map((author) => ({ url: `${SITE_URL}/authors/${author.handle}`, lastModified: author.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
