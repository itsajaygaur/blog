"use server"
import db from "@/db/drizzle"
import { blogs } from "@/db/schema"
import { auth } from "@/auth"
// import { randomUUID } from "crypto"
import { createId } from '@paralleldrive/cuid2';
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
        revalidatePath('/blogs')
        // redirect('/')
        return {success: true, message: "Blog added successfully"}

    } catch (error) {
         console.log({error})
         return {success: false, message: "Failed to add the blog"}
    }

}

export async function updateBlog(id: string, title: string, content: string){
    try {
        const session = await auth()
        if(!session?.user?.id) return {success: false, message: "Please login to update a blog"}
        if(!content || !title) return {success: false, message: "Please write something!"}

        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + "-" + createId()

        const updateBlog = await db.update(blogs).set({title, content, slug}).where(eq(blogs.id, id))

        if(!updateBlog) return {success: false, message: "Failed to update the blog"}

        revalidatePath('/blogs')
        // redirect('/')

        return {success: true, message: "Blog updated successfully"}

    } catch (error) {
        console.log({error})
        return {success: false, message: "Failed to update the blog"}
    }
}


export async function deleteBlog(id: string){
    try {
        const session = await auth()
        if(!session?.user?.id) return {success: false, message: "Please login to delete a blog"}

        const deleteBlog = await db.delete(blogs).where(eq(blogs.id, id))

        if(!deleteBlog) return {success: false, message: "Failed to delete the blog"}
        revalidatePath('/blogs')
        return {success: true, message: "Blog deleted successfully"}

    } catch (error) {
        console.log({error})
        return {success: false, message: "Failed to delete the blog"}
    }
}