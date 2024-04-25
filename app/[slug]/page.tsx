import db from "@/db/drizzle"
import { blogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MDXRemote } from "next-mdx-remote/rsc"
import { notFound } from "next/navigation"

export default async function BlogPost({params: {slug}}: {params: {slug: string}}){

    const blog = await db.select().from(blogs).where(eq(blogs.slug, slug))

    // console.log(blog)
    if(!blog.length) return notFound()

    return(
        <section>
        <div className="prose custom dark:text-white max-w-3xl mx-auto my-10" >
            <MDXRemote source={`${blog[0].content}`} />
        </div>
            
        </section>
    )
}