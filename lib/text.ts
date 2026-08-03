const HANDLE_LIMIT = 28;

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function createPostSlug(title: string, id: string) {
  return `${slugify(title) || "story"}-${id.replaceAll("-", "").slice(0, 8)}`;
}

export function createHandle(name: string, id: string) {
  const base = (slugify(name) || "writer").slice(0, HANDLE_LIMIT - 5);
  return `${base}-${id.replaceAll("-", "").slice(0, 4)}`;
}

export function readingTime(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function createExcerpt(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const slice = normalized.slice(0, maxLength + 1);
  return `${slice.slice(0, Math.max(slice.lastIndexOf(" "), maxLength - 24)).trim()}…`;
}

export function formatDate(date: Date | string | null) {
  if (!date) return "Unpublished";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
