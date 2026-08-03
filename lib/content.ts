import type { Block } from "@blocknote/core";
import sanitizeHtml from "sanitize-html";
import { createExcerpt, readingTime } from "@/lib/text";

export const EMPTY_DOCUMENT: Block[] = [
  {
    id: "draftline-opening",
    type: "paragraph",
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [],
    children: [],
  },
];

const sanitizerOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "figure",
    "figcaption",
    "img",
    "h1",
    "h2",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    "*": ["data-*"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
    img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
  },
};

export function sanitizeStoryHtml(html: string) {
  return sanitizeHtml(html, sanitizerOptions);
}

function normalizeComparableText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function removeDuplicateTitle(blocks: Block[], title: string) {
  const first = blocks[0];
  if (!first || first.type !== "heading" || !Array.isArray(first.content)) return blocks;

  const firstText = first.content
    .map((item) => ("text" in item && typeof item.text === "string" ? item.text : ""))
    .join("");

  return normalizeComparableText(firstText) === normalizeComparableText(title) ? blocks.slice(1) : blocks;
}

export function htmlToText(html: string) {
  const spacedHtml = html.replace(
    /<\/(?:address|article|aside|blockquote|div|figcaption|figure|footer|h[1-6]|header|li|main|nav|p|section|table|tr)>/gi,
    "$& ",
  );

  return sanitizeHtml(spacedHtml, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function processBlocks(blocks: Block[]) {
  const { ServerBlockNoteEditor } = await import("@blocknote/server-util");
  const editor = ServerBlockNoteEditor.create();
  const rawHtml = await editor.blocksToHTMLLossy(blocks);
  const html = sanitizeStoryHtml(rawHtml);
  const text = htmlToText(html);

  return {
    html,
    text,
    excerpt: createExcerpt(text),
    readingTimeMinutes: readingTime(text),
  };
}

export async function convertLegacyHtml(html: string, title = "") {
  const { ServerBlockNoteEditor } = await import("@blocknote/server-util");
  const editor = ServerBlockNoteEditor.create();
  const parsedBlocks = await editor.tryParseHTMLToBlocks(sanitizeStoryHtml(html));
  const blocks = title ? removeDuplicateTitle(parsedBlocks, title) : parsedBlocks;
  return { blocks, ...(await processBlocks(blocks)) };
}
