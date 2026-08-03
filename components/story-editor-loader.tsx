"use client";

import type { Block } from "@blocknote/core";
import dynamic from "next/dynamic";

const StoryEditor = dynamic(
  () => import("@/components/story-editor").then((module) => module.StoryEditor),
  {
    ssr: false,
    loading: () => <div className="mx-auto max-w-3xl animate-pulse py-20"><div className="h-16 rounded-2xl bg-secondary" /><div className="mt-6 h-8 rounded-xl bg-secondary" /><div className="mt-12 h-80 rounded-2xl bg-secondary" /></div>,
  },
);

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

export function StoryEditorLoader({ post }: { post: EditorPost }) {
  return <StoryEditor post={post} />;
}
