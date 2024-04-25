"use server"
import db from "@/db/drizzle"
import { blogs } from "@/db/schema"
import { auth } from "@/auth"
// import { randomUUID } from "crypto"
import { createId } from '@paralleldrive/cuid2';

export async function addBlog(title: string, content: string){

    try {
        const session = await auth()
        if(!session?.user?.id) return {success: false, message: "Please login to add the blog"}
        if(!content || !title) return {success: false, message: "Please write something!"}


        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + "-" + createId()
        // console.log({slug})
        // return {success: false, message: "Failed to add the blog"}
        const addBlog = await db.insert(blogs).values({title, content, slug, userId: session?.user?.id })

        if(!addBlog) return {success: false, message: "Failed to add the blog"}
        return {success: true, message: "Blog added successfully"}

    } catch (error) {
         console.log({error})
         return {success: false, message: "Failed to add the blog"}
    }

}