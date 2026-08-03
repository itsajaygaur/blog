"use client";

import "@mantine/core/styles.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { MantineProvider } from "@mantine/core";
import { upload } from "@vercel/blob/client";
import { Archive, Check, Cloud, Eye, ImagePlus, LoaderCircle, Send, Undo2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePostStatus, publishPost, saveDraft } from "@/app/actions";
import { Button } from "@/components/ui/button";

type EditorPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentJson: Block[];
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: "draft" | "published" | "archived";
  version: number;
  tags: string[];
};

export function StoryEditor({ post }: { post: EditorPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title === "Untitled story" ? "" : post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [tagInput, setTagInput] = useState(post.tags.join(", "));
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post.coverImageUrl);
  const [coverImageAlt, setCoverImageAlt] = useState(post.coverImageAlt ?? "");
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const versionRef = useRef(post.version);
  const mounted = useRef(false);

  const editor = useCreateBlockNote({
    initialContent: post.contentJson,
    uploadFile: async (file) => {
      try {
        const result = await upload(`draftline/${post.id}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/uploads",
          clientPayload: JSON.stringify({ postId: post.id, size: file.size, altText: file.name.replace(/\.[^.]+$/, "") }),
          onUploadProgress: ({ percentage }) => {
            setUploadProgress(Math.round(percentage));
            setSaveState("saving");
          },
        });
        setUploadProgress(null);
        setSaveState("unsaved");
        return result.url;
      } catch (error) {
        setUploadProgress(null);
        setSaveState("error");
        setMessage(error instanceof Error ? error.message : "Image upload failed.");
        throw error;
      }
    },
  });

  const persist = useCallback(async () => {
    setSaveState("saving");
    const result = await saveDraft({
      id: post.id,
      title,
      excerpt,
      contentJson: editor.document,
      coverImageUrl,
      coverImageAlt,
      tags: tagInput.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
      version: versionRef.current,
    });
    if (!result.ok) {
      setSaveState("error");
      setMessage(result.message);
      return null;
    }
    versionRef.current = result.data.version;
    setSaveState("saved");
    setMessage("");
    return result.data.version;
  }, [coverImageAlt, coverImageUrl, editor, excerpt, post.id, tagInput, title]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveState("unsaved");
    const timer = window.setTimeout(() => void persist(), 1200);
    return () => window.clearTimeout(timer);
  }, [title, excerpt, tagInput, coverImageUrl, coverImageAlt, revision, persist]);

  async function uploadCover(file: File) {
    try {
      setSaveState("saving");
      const result = await upload(`draftline/${post.id}/cover-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        clientPayload: JSON.stringify({ postId: post.id, size: file.size, altText: coverImageAlt || file.name.replace(/\.[^.]+$/, "") }),
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });
      setUploadProgress(null);
      setCoverImageUrl(result.url);
      setCoverImageAlt((current) => current || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    } catch (error) {
      setUploadProgress(null);
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Cover upload failed.");
    }
  }

  return (
    <MantineProvider forceColorScheme="light">
      <div className="editor-shell">
        <div className="sticky top-16 z-30 -mx-4 mb-10 border-b bg-background/92 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground" aria-live="polite">
              {saveState === "saving" && <LoaderCircle className="size-3.5 animate-spin" />}
              {saveState === "saved" && <Check className="size-3.5 text-emerald-600" />}
              {saveState === "unsaved" && <Cloud className="size-3.5" />}
              {saveState === "error" && <Cloud className="size-3.5 text-destructive" />}
              {uploadProgress !== null ? `Uploading ${uploadProgress}%` : saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : saveState === "error" ? message : "Unsaved changes"}
            </div>
            <div className="flex items-center gap-2">
              {post.status === "published" && <Button asChild variant="ghost" size="sm"><a href={`/stories/${post.slug}`} target="_blank"><Eye className="mr-2 size-4" />Preview</a></Button>}
              <Button type="button" variant="outline" size="sm" disabled={isPending || saveState === "saving"} onClick={() => void persist()}><UploadCloud className="mr-2 size-4" />Save</Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending || saveState === "saving"}
                onClick={() => startTransition(async () => {
                  const version = await persist();
                  if (!version) return;
                  const result = await publishPost(post.id, version);
                  if (!result.ok) { setMessage(result.message); setSaveState("error"); return; }
                  versionRef.current = result.data.version;
                  router.push(`/stories/${result.data.slug}`);
                  router.refresh();
                })}
              >
                {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}{post.status === "published" ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <label htmlFor="story-title" className="sr-only">Story title</label>
          <textarea id="story-title" value={title} onChange={(event) => setTitle(event.target.value)} rows={2} maxLength={120} placeholder="Your story begins with a clear title…" className="w-full resize-none bg-transparent font-serif text-5xl font-semibold leading-[1.02] tracking-tight outline-none placeholder:text-muted-foreground/45 sm:text-6xl" />
          <label htmlFor="story-excerpt" className="sr-only">Story summary</label>
          <textarea id="story-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={2} maxLength={240} placeholder="A concise summary that invites readers in…" className="mt-5 w-full resize-none bg-transparent text-lg leading-8 text-muted-foreground outline-none placeholder:text-muted-foreground/45" />

          <div className="my-8 grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <label htmlFor="cover-alt" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cover image</label>
              <input id="cover-alt" value={coverImageAlt} onChange={(event) => setCoverImageAlt(event.target.value)} placeholder="Describe the image for readers using assistive technology" className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold hover:bg-secondary">
              <ImagePlus className="mr-2 size-4" />{coverImageUrl ? "Replace cover" : "Add cover"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCover(file); }} />
            </label>
          </div>

          <BlockNoteView editor={editor} onChange={() => setRevision((value) => value + 1)} theme="light" />

          <div className="mt-10 border-t pt-8">
            <label htmlFor="story-tags" className="text-sm font-semibold">Topics</label>
            <p className="mt-1 text-sm text-muted-foreground">Up to five, separated by commas.</p>
            <input id="story-tags" value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Design, Engineering, Career" className="mt-3 h-11 w-full rounded-xl border bg-card px-4 outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-6 flex flex-wrap gap-2">
              {post.status === "published" && <Button variant="outline" type="button" disabled={isPending} onClick={() => startTransition(async () => { await changePostStatus(post.id, "draft"); router.push("/studio"); router.refresh(); })}><Undo2 className="mr-2 size-4" />Unpublish</Button>}
              <Button variant="ghost" type="button" disabled={isPending} className="text-muted-foreground hover:text-destructive" onClick={() => { if (window.confirm("Archive this story? It will disappear from public pages.")) startTransition(async () => { await changePostStatus(post.id, "archived"); router.push("/studio"); router.refresh(); }); }}><Archive className="mr-2 size-4" />Archive story</Button>
            </div>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}
