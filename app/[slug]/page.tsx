import { Button } from "@/components/ui/button"
import db from "@/db/drizzle"
import { blogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MDXRemote } from "next-mdx-remote/rsc"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { deleteBlog } from "../actions"

export default async function BlogPost({params: {slug}}: {params: {slug: string}}){

    const blog = await db.select().from(blogs).where(eq(blogs.slug, slug))
    const session = await auth()
    // console.log(blog)
    if(!blog.length) return notFound()

    return(
        <section>
        <div className="prose prose-h1:text-5xl dark:prose-headings:text-white dark:prose-p:text-white dark:*:prose-p:text-white  dark:prose-blockquote:text-white  max-w-3xl mx-auto my-10 " >

            {
                session?.user &&
                <div className="flex items-center justify-end gap-2" >
                <Link href={`/${slug}/edit`} >
                    <Button variant="link" >Edit</Button>
                </Link>
                <form action={async () => {
                    "use server"
                    const res = await deleteBlog(blog[0].id)
                    if(res.success) return redirect(`/`)
                }}>

                <Button  type="submit" variant="destructive" >
                    Delete
                </Button>
                </form>
                </div>
            }

            {/* <MDXRemote source={`${blog[0].content}`} /> */}
            <div className="px-[54px]" dangerouslySetInnerHTML={{__html: `${blog[0].content}` }} ></div>
        </div>
            
        </section>
    )
}