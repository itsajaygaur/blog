import { auth, signIn, signOut } from "@/auth";
import Navbar from "@/components/Navbar";
import ThemeToggler from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import db from "@/db/drizzle";
import { blogs } from "@/db/schema";
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from "next/link";
 


export default async function Home() {
 const session = await auth()

 const allBlogs = await db.select().from(blogs)
 
  return (
    <main>

      <div className="text-center pt-44" >
        <h1 className="text-7xl font-bold mb-6" >Discover the Latest <span className="text-sky-500" > Insights </span></h1>
        <p className="text-2xl max-w-2xl mx-auto mb-6" >Explore our collection of thought-provoking articles and stay ahead of the curve.</p>
        <Button  >Read Blogs</Button>
      </div>
      {/* <div className="prose custom dark:text-white" >
        <MDXRemote source={`${blog[1].content}`} />
      </div> */}
      {
        allBlogs.map((blog, index) => (
          <Link key={index} href={`/${blog.slug}`} className="hover:underline" >
              <p className="text-2xl font-medium mt-20 text-center" >{blog.title}</p> 
          </Link>
      ))
      }

    </main>
  );
}
