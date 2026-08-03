import { eq } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";
import { getDb } from "@/db/drizzle";
import { posts } from "@/db/schema";

export default async function LegacyStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getDb().query.posts.findFirst({ where: eq(posts.slug, slug), columns: { slug: true } });
  if (!story) notFound();
  permanentRedirect(`/stories/${story.slug}`);
}
