import { describe, expect, it } from "vitest";
import { htmlToText, removeDuplicateTitle, sanitizeStoryHtml } from "@/lib/content";

describe("story content security", () => {
  it("removes scripts, event handlers, and unsafe URLs", () => {
    const html = sanitizeStoryHtml('<p onclick="steal()">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>');
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("noopener noreferrer");
  });

  it("extracts normalized plain text", () => {
    expect(htmlToText("<h2>Clear&nbsp;thinking</h2><p>for &amp; by people.</p>")).toBe("Clear thinking for & by people.");
  });

  it("removes a legacy heading that repeats the story title", () => {
    const blocks = [
      { id: "title", type: "heading", props: {}, content: [{ type: "text", text: "A clear\u00a0idea", styles: {} }], children: [] },
      { id: "body", type: "paragraph", props: {}, content: [{ type: "text", text: "The opening.", styles: {} }], children: [] },
    ];
    expect(removeDuplicateTitle(blocks as never, "A clear idea")).toHaveLength(1);
  });
});
