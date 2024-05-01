import { Button } from "@/components/ui/button"
import db from "@/db/drizzle"
import { blogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MDXRemote } from "next-mdx-remote/rsc"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { deleteBlog } from "../actions"
import { Ellipsis } from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export async function generateMetadata({params: {slug}}: {params: {slug: string}}){
    const blog = await db.select().from(blogs).where(eq(blogs.slug, slug))
    return{
      title: blog[0].title,
    }
  }
  

export default async function BlogPost({params: {slug}}: {params: {slug: string}}){

    const blog = await db.select().from(blogs).where(eq(blogs.slug, slug))
    const session = await auth()
    // console.log(blog)
    if(!blog.length) return notFound()


    return(
        <section>
        <div className="prose prose-h1:text-5xl dark:prose-headings:text-white dark:prose-p:text-white dark:*:prose-p:text-white  dark:prose-blockquote:text-white prose-img:w-full  max-w-3xl mx-auto my-10 " >

<div className="text-end" >

        {
                session?.user &&

        <DropdownMenu  >
      <DropdownMenuTrigger asChild className="" > 
        {/* <Button variant="outline">Open</Button> */}
        <Button variant="ghost" >
        <Ellipsis />
        </Button>

      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

                <Link href={`/${slug}/edit`} className="w-full hover:bg-pink-400" >
        <DropdownMenuItem >
                    Edit
        </DropdownMenuItem>
                </Link>

                <form className="w-full" action={async () => {
                    "use server"
                    const res = await deleteBlog(blog[0].id)
                    if(res.success) return redirect(`/blogs`)
                    }}>

                <button type="submit" className=" w-full"   >
        <DropdownMenuItem className="" >
                    Delete
        </DropdownMenuItem>
                </button>
                </form>


      </DropdownMenuContent>
    </DropdownMenu>
}

</div>

            {/* <MDXRemote source={`${blog[0].content}`} /> */}
            <div className="px-4" dangerouslySetInnerHTML={{__html: `${blog[0].content}` }} ></div>
        </div>
            
        </section>
    )
}