import { ArrowRight, Feather, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { StoryCard } from "@/components/story-card";
import { Button } from "@/components/ui/button";
import { getPopularTags, listPublishedStories } from "@/lib/posts";

export default async function HomePage() {
  const [{ stories }, popularTags] = await Promise.all([listPublishedStories(), getPopularTags()]);
  const [featured, ...latest] = stories;

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="grain absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Independent ideas, beautifully told
            </div>
            <h1 className="text-balance font-serif text-6xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-[7.8rem]">
              Make room for <span className="italic text-primary">better</span> ideas.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Draftline is a thoughtful home for writers who care about clarity, craft, and the readers on the other side.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/stories">Explore stories <ArrowRight className="ml-2 size-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/studio">Write on Draftline <Feather className="ml-2 size-4" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4 border-b pb-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Editor’s pick</p><h2 className="mt-2 font-serif text-4xl font-semibold">Start here</h2></div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/stories">View all <ArrowRight className="ml-2 size-4" /></Link></Button>
        </div>
        {featured ? <StoryCard story={featured} featured /> : <EmptyHome />}
      </section>

      {latest.length > 0 && (
        <section className="border-y bg-card/55">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between"><h2 className="font-serif text-4xl font-semibold">Fresh thinking</h2><Search className="size-6 text-muted-foreground" /></div>
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{latest.slice(0, 6).map((story) => <StoryCard key={story.id} story={story} />)}</div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">Browse by curiosity</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {popularTags.length ? popularTags.map((tag) => <Link key={tag.slug} href={`/stories?tag=${tag.slug}`} className="rounded-full border border-background/25 px-5 py-2.5 font-serif text-xl transition hover:bg-background hover:text-foreground">{tag.name} <span className="text-sm opacity-50">{tag.count}</span></Link>) : <span className="font-serif text-2xl opacity-70">Topics will appear as writers publish.</span>}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyHome() {
  return <div className="grain rounded-3xl border bg-card px-6 py-20 text-center"><Feather className="mx-auto size-8 text-primary" /><h3 className="mt-5 font-serif text-3xl font-semibold">The first page is yours.</h3><p className="mx-auto mt-3 max-w-md text-muted-foreground">Publish the first thoughtful story and set Draftline in motion.</p><Button asChild className="mt-6"><Link href="/studio">Open the studio</Link></Button></div>;
}
