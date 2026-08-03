"use server";

import { randomUUID } from "node:crypto";
import type { Block } from "@blocknote/core";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/drizzle";
import { authUsers, posts, postTags, tags } from "@/db/schema";
import { EMPTY_DOCUMENT, processBlocks } from "@/lib/content";
import { requireSession } from "@/lib/session";
import { createPostSlug, slugify } from "@/lib/text";
import {
  type ActionResult,
  postDraftSchema,
  profileSchema,
  publishPostSchema,
} from "@/lib/validation";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

async function syncTags(postId: string, names: string[]) {
  const database = getDb();
  const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 5);

  await database.delete(postTags).where(eq(postTags.postId, postId));
  if (!normalized.length) return;

  const values = normalized.map((name) => ({
    id: randomUUID(),
    name,
    slug: slugify(name),
  }));
  await database.insert(tags).values(values).onConflictDoNothing({ target: tags.slug });
  const storedTags = await database
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.slug, values.map((tag) => tag.slug)));
  await database
    .insert(postTags)
    .values(storedTags.map((tag) => ({ postId, tagId: tag.id })))
    .onConflictDoNothing();
}

export async function createDraft() {
  const session = await requireSession("/studio");
  const id = randomUUID();
  await getDb().insert(posts).values({
    id,
    slug: createPostSlug("untitled", id),
    title: "Untitled story",
    content: "<p></p>",
    userId: session.user.id,
    authorId: session.user.id,
    excerpt: "",
    contentJson: EMPTY_DOCUMENT,
    contentHtml: "<p></p>",
    contentText: "",
    status: "draft",
  });
  redirect(`/studio/posts/${id}`);
}

export async function saveDraft(input: {
  id: string;
  title: string;
  excerpt: string;
  contentJson: Block[];
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  tags: string[];
  version: number;
}): Promise<ActionResult<{ version: number; savedAt: string }>> {
  const session = await requireSession(`/studio/posts/${input.id}`);
  const parsed = postDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const content = await processBlocks(input.contentJson);
  const excerpt = input.excerpt.trim() || content.excerpt;
  const updated = await getDb()
    .update(posts)
    .set({
      title: input.title.trim() || "Untitled story",
      excerpt,
      contentJson: input.contentJson,
      contentHtml: content.html,
      content: content.html,
      contentText: content.text,
      readingTimeMinutes: content.readingTimeMinutes,
      coverImageUrl: input.coverImageUrl || null,
      coverImageAlt: input.coverImageAlt?.trim() || null,
      updatedAt: new Date(),
      version: input.version + 1,
    })
    .where(
      and(
        eq(posts.id, input.id),
        eq(posts.authorId, session.user.id),
        eq(posts.version, input.version),
      ),
    )
    .returning({ version: posts.version, updatedAt: posts.updatedAt });

  if (!updated[0]) {
    return {
      ok: false,
      message: "This story changed in another tab. Refresh before continuing.",
    };
  }

  await syncTags(input.id, input.tags);
  revalidatePath("/studio");
  return {
    ok: true,
    data: { version: updated[0].version, savedAt: updated[0].updatedAt.toISOString() },
  };
}

export async function publishPost(id: string, version: number): Promise<ActionResult<{ slug: string; version: number }>> {
  const session = await requireSession(`/studio/posts/${id}`);
  const story = await getDb().query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.authorId, session.user.id)),
  });
  if (!story) return { ok: false, message: "Story not found." };

  const tagRows = await getDb()
    .select({ name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, id));
  const parsed = publishPostSchema.safeParse({
    ...story,
    tags: tagRows.map((tag) => tag.name),
    version,
  });
  if (!parsed.success) {
    return { ok: false, message: "Complete the story before publishing.", fieldErrors: fieldErrors(parsed.error) };
  }

  const updated = await getDb()
    .update(posts)
    .set({
      status: "published",
      publishedAt: story.publishedAt ?? new Date(),
      updatedAt: new Date(),
      version: version + 1,
    })
    .where(and(eq(posts.id, id), eq(posts.authorId, session.user.id), eq(posts.version, version)))
    .returning({ slug: posts.slug, version: posts.version });
  if (!updated[0]) return { ok: false, message: "Save the latest changes before publishing." };

  revalidatePath("/");
  revalidatePath("/stories");
  revalidatePath(`/stories/${updated[0].slug}`);
  revalidatePath("/studio");
  return { ok: true, data: updated[0], message: "Story published." };
}

export async function changePostStatus(
  id: string,
  status: "draft" | "archived",
): Promise<ActionResult> {
  const session = await requireSession("/studio");
  const updated = await getDb()
    .update(posts)
    .set({ status, updatedAt: new Date(), version: sql`${posts.version} + 1` })
    .where(and(eq(posts.id, id), eq(posts.authorId, session.user.id)))
    .returning({ slug: posts.slug });
  if (!updated[0]) return { ok: false, message: "Story not found." };
  revalidatePath("/");
  revalidatePath("/stories");
  revalidatePath("/studio");
  return { ok: true, data: undefined, message: status === "archived" ? "Story archived." : "Story moved to drafts." };
}

export async function updateProfile(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession("/settings/profile");
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    handle: formData.get("handle"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    await getDb()
      .update(authUsers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(authUsers.id, session.user.id));
  } catch {
    return { ok: false, message: "That handle is already in use." };
  }
  revalidatePath(`/authors/${parsed.data.handle}`);
  revalidatePath("/studio");
  return { ok: true, data: undefined, message: "Profile updated." };
}

// Compatibility wrappers for the legacy UI surface during the route migration.
export async function addBlog() {
  return { success: false, message: "Use the Draftline studio to create stories." };
}
export async function updateBlog() {
  return { success: false, message: "Use the Draftline studio to edit stories." };
}
export async function deleteBlog(id: string) {
  const result = await changePostStatus(id, "archived");
  return { success: result.ok, message: result.message ?? "Story archived." };
}
