import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { StoryCard as StoryCardType } from "@/lib/posts";
import { formatDate } from "@/lib/text";

export function StoryCard({ story, featured = false }: { story: StoryCardType; featured?: boolean }) {
  return (
    <article className={featured ? "grid gap-7 md:grid-cols-[1.2fr_1fr] md:items-center" : "group"}>
      <Link href={`/stories/${story.slug}`} className={`grain relative block overflow-hidden rounded-2xl bg-secondary ${featured ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        {story.coverImageUrl ? (
          <Image src={story.coverImageUrl} alt={story.coverImageAlt ?? ""} fill priority={featured} sizes={featured ? "(max-width: 768px) 100vw, 55vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8">
            <span className="max-w-[12ch] text-center font-serif text-3xl italic text-muted-foreground/60">Ideas take shape here.</span>
          </div>
        )}
      </Link>
      <div className={featured ? "" : "pt-5"}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {story.tags.slice(0, 2).map((tag) => <Link key={tag.slug} href={`/stories?tag=${tag.slug}`} className="hover:text-primary">{tag.name}</Link>)}
          <span>·</span><span>{story.readingTimeMinutes} min read</span>
        </div>
        <h2 className={`${featured ? "text-4xl sm:text-5xl" : "text-3xl"} text-balance font-serif font-semibold leading-[1.06] tracking-tight`}>
          <Link href={`/stories/${story.slug}`} className="hover:text-primary">{story.title}</Link>
        </h2>
        <p className="mt-3 line-clamp-3 leading-7 text-muted-foreground">{story.excerpt}</p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <Link href={`/authors/${story.author.handle}`} className="flex min-w-0 items-center gap-3">
            <Avatar name={story.author.name} image={story.author.image} className="size-9" />
            <span className="min-w-0"><span className="block truncate text-sm font-semibold">{story.author.name}</span><span className="block text-xs text-muted-foreground">{formatDate(story.publishedAt)}</span></span>
          </Link>
          <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
        </div>
      </div>
    </article>
  );
}
