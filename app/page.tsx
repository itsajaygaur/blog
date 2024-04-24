// import Editor from "@/components/Editor";
import ThemeToggler from "@/components/ThemeToggler";
import dynamic from "next/dynamic";
 
const Editor = dynamic(() => import("../components/Editor"), { ssr: false });


export default function Home() {

  return (
    <main>
      Hello World
      <ThemeToggler />
      <div className="max-w-5xl mx-auto" >
        <Editor />
      </div>
    </main>
  );
}
