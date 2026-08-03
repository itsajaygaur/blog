import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { StoryCard } from "@/components/story-card";
import { Button } from "@/components/ui/button";
import { getPopularTags, listPublishedStories } from "@/lib/posts";

export const metadata: Metadata = { title: "Stories", description: "Explore thoughtful stories from independent creators on Draftline." };

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string; page?: string }> }) {
  const input = await searchParams;
  const [result, popularTags] = await Promise.all([listPublishedStories(input), getPopularTags()]);
  const queryString = (page: number) => {
    const params = new URLSearchParams();
    if (result.query) params.set("q", result.query);
    if (result.tag) params.set("tag", result.tag);
    params.set("page", String(page));
    return params.toString();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The reading room</p><h1 className="mt-3 font-serif text-6xl font-semibold tracking-tight sm:text-7xl">Ideas worth your attention.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Browse independent perspectives, practical lessons, and honest work in progress.</p></div>
      <form className="mt-10 flex max-w-2xl items-center gap-2 rounded-full border bg-card p-2 shadow-sm" role="search">
        <Search className="ml-3 size-5 text-muted-foreground" aria-hidden />
        <label htmlFor="story-search" className="sr-only">Search stories</label>
        <input id="story-search" name="q" defaultValue={result.query} placeholder="Search by title, topic, or idea…" className="h-10 min-w-0 flex-1 bg-transparent px-2 outline-none placeholder:text-muted-foreground" />
        {result.tag && <input type="hidden" name="tag" value={result.tag} />}
        <Button type="submit">Search</Button>
      </form>
      <div className="mt-8 flex flex-wrap gap-2"><Link href={result.query ? `/stories?q=${encodeURIComponent(result.query)}` : "/stories"} className={`rounded-full border px-4 py-2 text-sm ${!result.tag ? "bg-foreground text-background" : "hover:bg-secondary"}`}>All topics</Link>{popularTags.map((tag) => <Link key={tag.slug} href={`/stories?tag=${tag.slug}${result.query ? `&q=${encodeURIComponent(result.query)}` : ""}`} className={`rounded-full border px-4 py-2 text-sm ${result.tag === tag.slug ? "bg-foreground text-background" : "hover:bg-secondary"}`}>{tag.name}</Link>)}</div>
      <div className="mt-14 flex items-baseline justify-between border-b pb-5"><h2 className="font-serif text-3xl font-semibold">{result.query ? `Results for “${result.query}”` : result.tag ? "Selected stories" : "Latest stories"}</h2><span className="text-sm text-muted-foreground">{result.total} {result.total === 1 ? "story" : "stories"}</span></div>
      {result.stories.length ? <div className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{result.stories.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <div className="grain mt-10 rounded-3xl border py-20 text-center"><h2 className="font-serif text-3xl font-semibold">No stories found</h2><p className="mt-2 text-muted-foreground">Try a broader search or explore another topic.</p><Button asChild variant="outline" className="mt-6"><Link href="/stories">Clear filters</Link></Button></div>}
      {result.pageCount > 1 && <nav aria-label="Story pagination" className="mt-16 flex items-center justify-center gap-3"><Button asChild variant="outline" className={result.page <= 1 ? "pointer-events-none opacity-40" : ""}><Link href={`/stories?${queryString(result.page - 1)}`}>Previous</Link></Button><span className="px-3 text-sm text-muted-foreground">Page {result.page} of {result.pageCount}</span><Button asChild variant="outline" className={result.page >= result.pageCount ? "pointer-events-none opacity-40" : ""}><Link href={`/stories?${queryString(result.page + 1)}`}>Next</Link></Button></nav>}
    </div>
  );
}
