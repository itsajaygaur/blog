import { Button } from "@/components/ui/button";
import db from "@/db/drizzle";
import { blogs } from "@/db/schema";
import Link from "next/link";
import cheerio from "cheerio";
import Image from "next/image";



export default async function AllBlogs() {
  const allBlogs = await db.select().from(blogs);

  return (
    <section className="pt-10 max-w-xl mx-auto px-4" >

      <h1 className="" >All Blogs</h1>
      <div className=" my-20  divide-y-2 space-y-5">
        {allBlogs.map((blog, index) => {
          const $ = cheerio.load(blog.content!);

          // Get the first <img> tag
          let blogImage: string | undefined = undefined;


          const firstImg = $("img").first();


          if (firstImg.length > 0) {
            blogImage = firstImg.attr("src"); // Get the value of the 'src' attribute
          }
          return (
            <Link
              key={blog.id}
              href={`/${blog.slug}`}
              className="flex items-start justify-between gap-5 pt-5 first:pt-0"
            >
              <div>

              <h2 className="text-3xl mb-2 font-medium line-clamp-3">{blog.title}</h2>
              <p className="text-sm" >{Math.floor(Math.random() * 8 + 2)} min read</p>
              </div>
              <Image
                src={blogImage || "https://placehold.co/600x400?text=:("}
                alt="Blog Image"
                width={125}
                height={125}
                className=" aspect-square object-cover"
                unoptimized
                />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
