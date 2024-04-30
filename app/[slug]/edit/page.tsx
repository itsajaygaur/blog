import { auth } from "@/auth";
import db from "@/db/drizzle";
import { blogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default async function EditBlog({params: {slug}}: {params: {slug: string}}){

    const slugFromDb = await db.select().from(blogs).where(eq(blogs.slug, slug))
    if(!slugFromDb.length) return <h1 className="text-center mt-5" >Blog not found!</h1>

    const session = await auth()
    if(slugFromDb[0].userId !== session?.user?.id) return <h1 className="text-center mt-5" >You are not authorized to edit this blog!</h1>


    return(
        <section className="max-w-3xl mx-auto my-10" >
            {/* <Editor initialMarkdown={slugFromDb[0].content} /> */}
            <Editor blogToUpdate={slugFromDb[0]} />
        </section>
    )
}