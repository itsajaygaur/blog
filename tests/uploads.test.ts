import { describe, expect, it } from "vitest";
import { getUploadErrorMessage, validateImageUpload } from "@/lib/uploads";

describe("image uploads", () => {
  it("rejects unsupported and oversized files before upload", () => {
    expect(validateImageUpload({ type: "image/svg+xml", size: 100 })).toMatch(/JPEG/);
    expect(validateImageUpload({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toMatch(/smaller than 5 MB/);
    expect(validateImageUpload({ type: "image/webp", size: 1024 })).toBeNull();
  });

  it("turns disturbed stream failures into actionable feedback", () => {
    expect(getUploadErrorMessage(new TypeError("Failed to execute 'fetch' on 'Window': The provided ReadableStream is disturbed")))
      .toBe("The image upload was interrupted. Check your connection and try again.");
  });
});
