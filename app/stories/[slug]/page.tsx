import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareButton } from "@/components/share-button";
import { getPublishedStory, getRelatedStories } from "@/lib/posts";
import { formatDate } from "@/lib/text";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedStory(slug);
  if (!result) return { title: "Story not found" };
  const { post, author } = result;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/stories/${post.slug}` },
    authors: [{ name: author.name, url: `/authors/${author.handle}` }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [`${SITE_URL}/authors/${author.handle}`],
      images: post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.coverImageAlt ?? "" }] : undefined,
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedStory(slug);
  if (!result) notFound();
  const { post, author, tags } = result;
  const related = await getRelatedStories(post.id, author.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: author.name, url: `${SITE_URL}/authors/${author.handle}` },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/stories/${post.slug}`,
  };

  return (
    <article>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{tags.map((tag) => <Link key={tag.slug} href={`/stories?tag=${tag.slug}`} className="hover:underline">{tag.name}</Link>)}</div>
        <h1 className="mt-5 text-balance font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.035em] sm:text-7xl">{post.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href={`/authors/${author.handle}`} className="flex items-center gap-3 text-left"><Avatar name={author.name} image={author.image} className="size-11" /><span><span className="block text-sm font-semibold">{author.name}</span><span className="block text-xs text-muted-foreground">{formatDate(post.publishedAt)} · {post.readingTimeMinutes} min read</span></span></Link>
          <ShareButton title={post.title} />
        </div>
      </header>
      {post.coverImageUrl && <div className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden rounded-none bg-secondary sm:rounded-3xl"><Image src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} fill priority sizes="(max-width: 1200px) 100vw, 1152px" className="object-cover" /></div>}
      <div className="prose prose-lg story-content mx-auto mt-14 max-w-3xl px-5 font-serif prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-img:w-full dark:prose-invert sm:px-6" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      <footer className="mx-auto mt-16 max-w-3xl border-t px-4 pt-10 sm:px-6">
        <div className="flex items-start gap-4 rounded-2xl bg-card p-6"><Avatar name={author.name} image={author.image} className="size-14" /><div><p className="text-sm text-muted-foreground">Written by</p><Link href={`/authors/${author.handle}`} className="font-serif text-2xl font-semibold hover:text-primary">{author.name}</Link><p className="mt-2 leading-6 text-muted-foreground">{author.bio || "Independent creator on Draftline."}</p></div></div>
      </footer>
      {related.length > 0 && <section className="mx-auto mt-20 max-w-5xl border-t px-4 pt-12 sm:px-6"><h2 className="font-serif text-3xl font-semibold">More from {author.name}</h2><div className="mt-6 divide-y">{related.map((item) => <Link key={item.id} href={`/stories/${item.slug}`} className="group flex items-center justify-between gap-6 py-6"><div><h3 className="font-serif text-2xl font-semibold group-hover:text-primary">{item.title}</h3><p className="mt-1 line-clamp-1 text-muted-foreground">{item.excerpt}</p></div><ArrowRight className="size-5 shrink-0" /></Link>)}</div></section>}
    </article>
  );
}
