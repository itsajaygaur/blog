import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function NewStory(){
    return(
        <div className="max-w-5xl mx-auto mt-20 pb-20" >

            <Editor />
        </div>
    )
}