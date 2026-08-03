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
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePostStatus, publishPost, saveDraft } from "@/app/actions";
import { startNavigation } from "@/components/navigation-progress";
import { Button } from "@/components/ui/button";
import { getUploadErrorMessage, validateImageUpload } from "@/lib/uploads";

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
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === "dark" ? "dark" : "light";
  const [title, setTitle] = useState(post.title === "Untitled story" ? "" : post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [tagInput, setTagInput] = useState(post.tags.join(", "));
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post.coverImageUrl);
  const [coverImageAlt, setCoverImageAlt] = useState(post.coverImageAlt ?? "");
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const versionRef = useRef(post.version);
  const saveQueueRef = useRef<Promise<number | null>>(Promise.resolve(post.version));
  const autosaveTimerRef = useRef<number | null>(null);
  const mounted = useRef(false);

  const editor = useCreateBlockNote({
    initialContent: post.contentJson,
    uploadFile: async (file) => {
      const validationMessage = validateImageUpload(file);
      if (validationMessage) {
        setSaveState("error");
        setMessage(validationMessage);
        throw new Error(validationMessage);
      }
      try {
        setMessage("");
        setFieldErrors({});
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
        setMessage(getUploadErrorMessage(error));
        throw error;
      }
    },
  });

  const persist = useCallback(() => {
    setSaveState("saving");
    const operation = saveQueueRef.current.then(async () => {
      try {
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
          setFieldErrors(result.fieldErrors ?? {});
          return null;
        }
        versionRef.current = result.data.version;
        setSaveState("saved");
        setMessage("");
        setFieldErrors({});
        return result.data.version;
      } catch {
        setSaveState("error");
        setMessage("Draftline could not save this change. Your work is still in the editor—please try again.");
        setFieldErrors({});
        return null;
      }
    });
    saveQueueRef.current = operation;
    return operation;
  }, [coverImageAlt, coverImageUrl, editor, excerpt, post.id, tagInput, title]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSaveState("unsaved");
    if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void persist();
    }, 1200);
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [title, excerpt, tagInput, coverImageUrl, coverImageAlt, revision, persist]);

  async function uploadCover(file: File) {
    const validationMessage = validateImageUpload(file);
    if (validationMessage) {
      setSaveState("error");
      setMessage(validationMessage);
      return;
    }
    try {
      setSaveState("saving");
      setMessage("");
      setFieldErrors({});
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
      setMessage(getUploadErrorMessage(error));
    }
  }

  return (
    <MantineProvider forceColorScheme={editorTheme}>
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
                  if (autosaveTimerRef.current !== null) {
                    window.clearTimeout(autosaveTimerRef.current);
                    autosaveTimerRef.current = null;
                  }
                  const version = await persist();
                  if (!version) return;
                  try {
                    const result = await publishPost(post.id, version);
                    if (!result.ok) {
                      setMessage(result.message);
                      setFieldErrors(result.fieldErrors ?? {});
                      setSaveState("error");
                      return;
                    }
                    versionRef.current = result.data.version;
                    startNavigation();
                    router.push(`/stories/${result.data.slug}`);
                    router.refresh();
                  } catch {
                    setMessage("Publishing did not complete. Your draft is saved, so you can safely try again.");
                    setFieldErrors({});
                    setSaveState("error");
                  }
                })}
              >
                {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}{post.status === "published" ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </div>

        {saveState === "error" && message && (
          <div className="mx-auto mb-8 max-w-5xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            <p className="font-semibold">{message}</p>
            {Object.values(fieldErrors).flat().length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {[...new Set(Object.values(fieldErrors).flat())].map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
          </div>
        )}

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
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (file) void uploadCover(file);
              }} />
            </label>
          </div>

          <BlockNoteView editor={editor} onChange={() => setRevision((value) => value + 1)} theme={editorTheme} />

          <div className="mt-10 border-t pt-8">
            <label htmlFor="story-tags" className="text-sm font-semibold">Topics</label>
            <p className="mt-1 text-sm text-muted-foreground">Up to five, separated by commas.</p>
            <input id="story-tags" value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Design, Engineering, Career" className="mt-3 h-11 w-full rounded-xl border bg-card px-4 outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-6 flex flex-wrap gap-2">
              {post.status === "published" && <Button variant="outline" type="button" disabled={isPending} onClick={() => startTransition(async () => {
                try {
                  const result = await changePostStatus(post.id, "draft");
                  if (!result.ok) { setMessage(result.message); setSaveState("error"); return; }
                  startNavigation();
                  router.push("/studio");
                  router.refresh();
                } catch {
                  setMessage("The story could not be unpublished. Please try again.");
                  setSaveState("error");
                }
              })}><Undo2 className="mr-2 size-4" />Unpublish</Button>}
              <Button variant="ghost" type="button" disabled={isPending} className="text-muted-foreground hover:text-destructive" onClick={() => {
                if (window.confirm("Archive this story? It will disappear from public pages.")) startTransition(async () => {
                  try {
                    const result = await changePostStatus(post.id, "archived");
                    if (!result.ok) { setMessage(result.message); setSaveState("error"); return; }
                    startNavigation();
                    router.push("/studio");
                    router.refresh();
                  } catch {
                    setMessage("The story could not be archived. Please try again.");
                    setSaveState("error");
                  }
                });
              }}><Archive className="mr-2 size-4" />Archive story</Button>
            </div>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}
