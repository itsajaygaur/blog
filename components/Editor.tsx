
"use client"
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";
import { useTheme } from "next-themes";
 
export default function Editor() {

    const { resolvedTheme } = useTheme();


  // Creates a new editor instance.
  const editor = useCreateBlockNote();

 
  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} theme={resolvedTheme === "dark" ? "dark" : "light"} data-theming-css-variables-demo />;
}
 