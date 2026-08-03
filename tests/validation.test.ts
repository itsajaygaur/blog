import { describe, expect, it } from "vitest";
import { postDraftSchema, profileSchema, searchSchema } from "@/lib/validation";

describe("input validation", () => {
  it("normalizes invalid search pagination", () => {
    expect(searchSchema.parse({ page: "nope", q: "  design  " })).toEqual({ page: 1, q: "design", tag: "" });
  });

  it("rejects unsafe profile handles", () => {
    expect(profileSchema.safeParse({ name: "Ajay", handle: "Ajay Gaur!", bio: "" }).success).toBe(false);
  });

  it("caps story topics at five", () => {
    const result = postDraftSchema.safeParse({ id: "4f249c50-9d09-4528-a225-578377a7ec98", title: "Title", excerpt: "", contentJson: [{}], tags: ["1", "2", "3", "4", "5", "6"], version: 1 });
    expect(result.success).toBe(false);
  });
});
