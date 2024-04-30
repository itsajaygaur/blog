"use client";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addBlog, updateBlog } from "@/app/actions";
import { Blog } from "@/db/schema";
import { useRouter } from "next/navigation";

export default function Editor({blogToUpdate}: {blogToUpdate?: Blog }) {

  const router = useRouter()
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  // const editor = useCreateBlockNote({uploadFile});
  const editor = useCreateBlockNote();


  async function handlePublish() {
    try {
      setLoading(true);
      // const title = editor.document[0].content.length > 0 && editor.document[0].content[0].text
      const response = blogToUpdate?.id ? await updateBlog(blogToUpdate?.id!, title, markdown) : await addBlog(title, markdown);
      // console.log("response ", response);
      if(response.success) return router.replace('/')
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }

  async function handleChange() {
    setMarkdown(await editor.blocksToHTMLLossy(editor.document));
    const content = editor.getBlock(editor.document[0].id)?.content;
    const title =
      Array.isArray(content) &&
      content?.length > 0 &&
      content[0].type === "text"
        ? content[0].text.trim()
        : "";
    setTitle(title);
  }


  // async function uploadFile(file: File) {
  //   const body = new FormData();
  //   console.log({file})
  //   body.append("file", file);
   
  //   const ret = await fetch("https://tmpfiles.org/api/v1/upload", {
  //     method: "POST",
  //     body: body,
  //   });
  //   return (await ret.json()).data.url.replace(
  //     "tmpfiles.org/",
  //     "tmpfiles.org/dl/"
  //   );
  // }

  useEffect(() => {
    if(!blogToUpdate) return
    async function loadInitialHTML() {
      const blocks = await editor.tryParseHTMLToBlocks(blogToUpdate?.content!);
      editor.replaceBlocks(editor.document, blocks);
    }
    loadInitialHTML();
  }, [editor]);

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
