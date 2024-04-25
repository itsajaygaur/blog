"use client";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addBlog } from "@/app/actions";

export default function Editor() {
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  const editor = useCreateBlockNote();


  async function handlePublish() {
    try {
      setLoading(true);
      // const title = editor.document[0].content.length > 0 && editor.document[0].content[0].text
      const response = await addBlog(title, markdown);
      console.log("response ", response);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }

  async function handleChange() {
    setMarkdown(await editor.blocksToMarkdownLossy(editor.document));
    const content = editor.getBlock(editor.document[0].id)?.content;
    const title =
      Array.isArray(content) &&
      content?.length > 0 &&
      content[0].type === "text"
        ? content[0].text.trim()
        : "";
    setTitle(title);
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button
          disabled={loading || !markdown || !title}
          onClick={handlePublish}
        >
          {loading ? "Publishing..." : "Publish"}
        </Button>
      </div>

      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleChange}
        data-theming-css-variables-demo
      />
    </div>
  );
}
