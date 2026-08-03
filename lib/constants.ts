export const SITE_NAME = "Draftline";
export const SITE_DESCRIPTION =
  "A thoughtful publishing platform for independent creators.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://blogstory.vercel.app";
export const POSTS_PER_PAGE = 9;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
