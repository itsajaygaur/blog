import { describe, expect, it } from "vitest";
import { createExcerpt, createHandle, createPostSlug, readingTime, slugify } from "@/lib/text";

describe("text utilities", () => {
  it("creates stable URL-safe slugs", () => {
    expect(slugify("  Déjà Vu: A Builder's Story!  ")).toBe("deja-vu-a-builder-s-story");
    expect(createPostSlug("Hello World", "12345678-abcd")).toBe("hello-world-12345678");
  });

  it("creates unique readable handles", () => {
    expect(createHandle("Ajay Gaur", "abcd-1234")).toBe("ajay-gaur-abcd");
  });

  it("uses deterministic reading time", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime(Array.from({ length: 441 }, () => "word").join(" "))).toBe(3);
  });

  it("truncates excerpts at a word boundary", () => {
    const excerpt = createExcerpt("A thoughtful sentence about building reliable software for real people.", 40);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(42);
  });
});
