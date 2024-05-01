import { Button } from "@/components/ui/button";
import db from "@/db/drizzle";
import { blogs } from "@/db/schema";
import Link from "next/link";
import cheerio from "cheerio";
import Image from "next/image";

export default async function Home() {
  const allBlogs = await db.select().from(blogs);

  return (
    <main  >
      <div className="text-center pt-44 px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-8">
          Discover the Latest <span className="text-sky-500"> Insights </span>
        </h1>
        <p className=" sm:text-xl md:text-2xl max-w-2xl mx-auto mb-12">
          Explore our collection of thought-provoking articles and stay ahead of
          the curve.
        </p>
        <Link href="/blogs">
        <Button className="" >
          Read Blogs
        </Button>
        </Link>
      </div>


      {/* {allBlogs.map((blog, index) => {
        const $ = cheerio.load(blog.content!);

        // Get the first <img> tag
        let blogImage: string | undefined = undefined;

        const firstImg = $("img").first();

        if (firstImg.length > 0) {
          blogImage = firstImg.attr("src"); // Get the value of the 'src' attribute
        }

        return (
          <Link key={blog.id} href={`/${blog.slug}`} className="flex items-start justify-between gap-5">
              <p className="text-2xl font-medium">
                {blog.title}
              </p>
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
      })} */}

    </main>
  );
}
