import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryEditorLoader } from "@/components/story-editor-loader";
import { getOwnedPost } from "@/lib/posts";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Edit story" };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/studio/posts/${id}`);
  const post = await getOwnedPost(id, session.user.id);
  if (!post) notFound();
  return <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"><StoryEditorLoader post={{ id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt, contentJson: post.contentJson, coverImageUrl: post.coverImageUrl, coverImageAlt: post.coverImageAlt, status: post.status, version: post.version, tags: post.tags }} /></div>;
}
