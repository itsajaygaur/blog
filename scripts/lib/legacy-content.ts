import { ServerBlockNoteEditor } from "@blocknote/server-util";
import { processBlocks, removeDuplicateTitle, sanitizeStoryHtml } from "../../lib/content";

export async function convertLegacyHtml(html: string, title = "") {
  const editor = ServerBlockNoteEditor.create();
  const parsedBlocks = await editor.tryParseHTMLToBlocks(sanitizeStoryHtml(html));
  const blocks = title ? removeDuplicateTitle(parsedBlocks, title) : parsedBlocks;
  return { blocks, ...(await processBlocks(blocks)) };
}
