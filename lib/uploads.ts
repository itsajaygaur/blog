import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";

type UploadFile = Pick<File, "size" | "type">;

export function validateImageUpload(file: UploadFile) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Choose a JPEG, PNG, WebP, or AVIF image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Choose an image smaller than 5 MB.";
  }
  return null;
}

export function getUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/readablestream|failed to execute ['\"]?fetch|failed to fetch|network request|load failed/i.test(message)) {
    return "The image upload was interrupted. Check your connection and try again.";
  }
  if (/client token|presigned url/i.test(message)) {
    return "Draftline could not authorize this upload. Refresh the page and try again.";
  }
  return message || "Image upload failed. Please try again.";
}
