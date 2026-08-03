import { listPublishedStories } from "@/lib/posts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

function xml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!);
}

export async function GET() {
  const { stories } = await listPublishedStories({ page: 1 });
  const body = `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>${xml(SITE_NAME)}</title><link>${SITE_URL}</link><description>${xml(SITE_DESCRIPTION)}</description>${stories.map((story) => `<item><title>${xml(story.title)}</title><link>${SITE_URL}/stories/${story.slug}</link><guid>${SITE_URL}/stories/${story.slug}</guid><description>${xml(story.excerpt)}</description><pubDate>${story.publishedAt?.toUTCString() ?? new Date().toUTCString()}</pubDate><author>${xml(story.author.name)}</author></item>`).join("")}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } });
}
