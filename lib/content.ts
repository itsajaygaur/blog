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
    "details",
    "figure",
    "figcaption",
    "img",
    "summary",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    ol: ["start"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
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

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" ? (value as JsonRecord) : {};
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStyledText(value: unknown): string {
  if (typeof value === "string") return escapeHtml(value);

  const item = asRecord(value);
  if (item.type === "link") {
    const content = Array.isArray(item.content)
      ? item.content.map(renderStyledText).join("")
      : escapeHtml(item.content);
    return `<a href="${escapeHtml(item.href)}">${content}</a>`;
  }

  let text = escapeHtml(item.text ?? (typeof item.content === "string" ? item.content : ""));
  const styles = asRecord(item.styles);
  if (styles.code) text = `<code>${text}</code>`;
  if (styles.strike) text = `<s>${text}</s>`;
  if (styles.underline) text = `<u>${text}</u>`;
  if (styles.italic) text = `<em>${text}</em>`;
  if (styles.bold) text = `<strong>${text}</strong>`;
  return text;
}

function renderInlineContent(content: unknown) {
  if (typeof content === "string") return escapeHtml(content);
  return Array.isArray(content) ? content.map(renderStyledText).join("") : "";
}

function renderTable(content: JsonRecord) {
  if (!Array.isArray(content.rows)) return "";
  const headerRows = typeof content.headerRows === "number" ? content.headerRows : 0;
  const headerCols = typeof content.headerCols === "number" ? content.headerCols : 0;
  const rows = content.rows.map((rowValue, rowIndex) => {
    const row = asRecord(rowValue);
    if (!Array.isArray(row.cells)) return "";
    const cells = row.cells.map((cellValue, columnIndex) => {
      const cell = Array.isArray(cellValue) ? { content: cellValue } : asRecord(cellValue);
      const isHeader = rowIndex < headerRows || columnIndex < headerCols;
      const tag = isHeader ? "th" : "td";
      const props = asRecord(cell.props);
      const spans = [
        typeof props.colspan === "number" && props.colspan > 1 ? ` colspan="${props.colspan}"` : "",
        typeof props.rowspan === "number" && props.rowspan > 1 ? ` rowspan="${props.rowspan}"` : "",
        isHeader ? ` scope="${rowIndex < headerRows ? "col" : "row"}"` : "",
      ].join("");
      return `<${tag}${spans}>${renderInlineContent(cell.content)}</${tag}>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  });
  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

function listKind(type: unknown) {
  if (type === "numberedListItem") return "ol";
  if (type === "bulletListItem" || type === "checkListItem" || type === "toggleListItem") return "ul";
  return null;
}

function renderBlockBody(block: JsonRecord): string {
  const props = asRecord(block.props);
  const inline = renderInlineContent(block.content);
  switch (block.type) {
    case "heading": {
      const level = typeof props.level === "number" && props.level >= 1 && props.level <= 6 ? props.level : 2;
      return `<h${level}>${inline}</h${level}>`;
    }
    case "quote":
      return `<blockquote>${inline}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${inline}</code></pre>`;
    case "divider":
      return "<hr />";
    case "image": {
      if (typeof props.url !== "string" || !props.url) return "";
      const caption = typeof props.caption === "string" ? props.caption.trim() : "";
      const alt = typeof props.name === "string" && props.name.trim() ? props.name.trim() : caption;
      const width = typeof props.previewWidth === "number" && props.previewWidth > 0
        ? ` width="${Math.round(props.previewWidth)}"`
        : "";
      return `<figure><img src="${escapeHtml(props.url)}" alt="${escapeHtml(alt)}"${width} />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }
    case "audio":
    case "video":
    case "file": {
      if (typeof props.url !== "string" || !props.url) return "";
      const label = props.caption || props.name || `Open ${block.type}`;
      return `<p><a href="${escapeHtml(props.url)}">${escapeHtml(label)}</a></p>`;
    }
    case "table":
      return renderTable(asRecord(block.content));
    case "toggleListItem":
      return `<details><summary>${inline}</summary>${renderBlocks(block.children)}</details>`;
    default:
      return `<p>${inline}</p>`;
  }
}

function renderListItem(block: JsonRecord) {
  const props = asRecord(block.props);
  const checked = block.type === "checkListItem" ? ` data-checked="${props.checked === true}"` : "";
  return `<li${checked}>${renderInlineContent(block.content)}${renderBlocks(block.children)}</li>`;
}

function renderBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  let html = "";
  for (let index = 0; index < blocks.length;) {
    const block = asRecord(blocks[index]);
    const kind = listKind(block.type);
    if (!kind) {
      html += renderBlockBody(block);
      if (block.type !== "toggleListItem") html += renderBlocks(block.children);
      index += 1;
      continue;
    }

    const items: string[] = [];
    const start = kind === "ol" ? asRecord(block.props).start : undefined;
    while (index < blocks.length) {
      const nextBlock = asRecord(blocks[index]);
      if (listKind(nextBlock.type) !== kind) break;
      items.push(renderListItem(nextBlock));
      index += 1;
    }
    const startAttribute = typeof start === "number" && start > 1 ? ` start="${Math.round(start)}"` : "";
    html += `<${kind}${startAttribute}>${items.join("")}</${kind}>`;
  }
  return html;
}

export async function processBlocks(blocks: Block[]) {
  const rawHtml = renderBlocks(blocks);
  const html = sanitizeStoryHtml(rawHtml);
  const text = htmlToText(html);

  return {
    html,
    text,
    excerpt: createExcerpt(text),
    readingTimeMinutes: readingTime(text),
  };
}
