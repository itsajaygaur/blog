import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { getAuthorProfile } from "@/lib/posts";
import { formatDate } from "@/lib/text";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const result = await getAuthorProfile(handle);
  return result ? { title: result.author.name, description: result.author.bio || `Read stories by ${result.author.name} on Draftline.` } : { title: "Writer not found" };
}

export default async function AuthorPage({ params }: Props) {
  const { handle } = await params;
  const result = await getAuthorProfile(handle);
  if (!result) notFound();
  const { author, stories } = result;
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="grid gap-6 border-b pb-12 sm:grid-cols-[auto_1fr] sm:items-center"><Avatar name={author.name} image={author.image} className="size-24 sm:size-32" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">@{author.handle}</p><h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight sm:text-6xl">{author.name}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{author.bio || "Independent creator on Draftline."}</p><p className="mt-3 text-sm text-muted-foreground">{stories.length} published {stories.length === 1 ? "story" : "stories"}</p></div></header>
      <section className="py-12"><h2 className="font-serif text-3xl font-semibold">Published work</h2>{stories.length ? <div className="mt-6 divide-y">{stories.map((story) => <article key={story.id} className="grid gap-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{formatDate(story.publishedAt)} · {story.readingTimeMinutes} min</p><h3 className="mt-2 font-serif text-3xl font-semibold"><Link href={`/stories/${story.slug}`} className="hover:text-primary">{story.title}</Link></h3><p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{story.excerpt}</p></div><Button asChild variant="outline"><Link href={`/stories/${story.slug}`}>Read</Link></Button></article>)}</div> : <p className="mt-8 text-muted-foreground">No published stories yet.</p>}</section>
    </div>
  );
}
