import type { Metadata } from "next";
import { Archive, FileText, Plus, Send } from "lucide-react";
import Link from "next/link";
import { changePostStatus, createDraft } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getStudioData } from "@/lib/posts";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/text";

export const metadata: Metadata = { title: "Studio" };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [session, query] = await Promise.all([requireSession("/studio"), searchParams]);
  const data = await getStudioData(session.user.id);
  const selected = ["draft", "published", "archived"].includes(query.status ?? "") ? query.status! : "all";
  const stories = selected === "all" ? data.stories : data.stories.filter((story) => story.status === selected);

  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><header className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Creator studio</p><h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">Good to see you, {session.user.name?.split(" ")[0] ?? "writer"}.</h1><p className="mt-3 text-muted-foreground">Shape a draft, publish an idea, or return to work already in motion.</p></div><form action={createDraft}><Button size="lg" type="submit"><Plus className="mr-2 size-5" />New story</Button></form></header>
    <section className="mt-12 grid gap-4 sm:grid-cols-3"><Stat icon={<FileText />} label="Drafts" value={data.counts.draft} /><Stat icon={<Send />} label="Published" value={data.counts.published} /><Stat icon={<Archive />} label="Archived" value={data.counts.archived} /></section>
    <nav aria-label="Story status" className="mt-10 flex flex-wrap gap-2 border-b pb-4">{["all", "draft", "published", "archived"].map((status) => <Link key={status} href={status === "all" ? "/studio" : `/studio?status=${status}`} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${selected === status ? "bg-foreground text-background" : "hover:bg-secondary"}`}>{status}</Link>)}</nav>
    {stories.length ? <div className="divide-y">{stories.map((story) => <article key={story.id} className="grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span className="rounded-full bg-secondary px-2.5 py-1">{story.status}</span><span>Edited {formatDate(story.updatedAt)}</span>{story.status === "published" && <span>· {story.readingTimeMinutes} min read</span>}</div><h2 className="mt-3 font-serif text-3xl font-semibold"><Link href={`/studio/posts/${story.id}`} className="hover:text-primary">{story.title}</Link></h2><p className="mt-2 line-clamp-1 text-muted-foreground">{story.excerpt || "Add a summary to help readers understand what this story offers."}</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/studio/posts/${story.id}`}>Edit</Link></Button>{story.status === "published" && <Button asChild variant="ghost"><Link href={`/stories/${story.slug}`}>View</Link></Button>}{story.status === "archived" && <form action={async () => { "use server"; await changePostStatus(story.id, "draft"); }}><Button variant="ghost" type="submit">Restore</Button></form>}</div></article>)}</div> : <div className="grain mt-10 rounded-3xl border py-20 text-center"><h2 className="font-serif text-3xl font-semibold">Nothing here yet.</h2><p className="mt-2 text-muted-foreground">Create a new story or choose another status.</p><form action={createDraft} className="mt-6"><Button type="submit"><Plus className="mr-2 size-4" />Start a draft</Button></form></div>}
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm font-medium">{label}</span><span className="[&_svg]:size-4">{icon}</span></div><p className="mt-4 font-serif text-4xl font-semibold">{value}</p></div>; }
