import { eq } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";
import { getDb } from "@/db/drizzle";
import { posts } from "@/db/schema";

export default async function LegacyEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getDb().query.posts.findFirst({ where: eq(posts.slug, slug), columns: { id: true } });
  if (!story) notFound();
  permanentRedirect(`/studio/posts/${story.id}`);
}
