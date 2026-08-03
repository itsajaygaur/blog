import { describe, expect, it } from "vitest";
import { htmlToText, processBlocks, removeDuplicateTitle, sanitizeStoryHtml } from "@/lib/content";

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

  it("derives safe HTML and text directly from BlockNote JSON", async () => {
    const blocks = [
      {
        id: "heading",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "A <clear> idea", styles: { bold: true } }],
        children: [],
      },
      {
        id: "link",
        type: "paragraph",
        props: {},
        content: [{ type: "link", href: "javascript:alert(1)", content: [{ type: "text", text: "Read safely", styles: {} }] }],
        children: [],
      },
      {
        id: "one",
        type: "bulletListItem",
        props: {},
        content: [{ type: "text", text: "First point", styles: {} }],
        children: [],
      },
      {
        id: "two",
        type: "bulletListItem",
        props: {},
        content: [{ type: "text", text: "Second point", styles: {} }],
        children: [],
      },
    ];

    const result = await processBlocks(blocks as never);
    expect(result.html).toContain("<h2><strong>A &lt;clear&gt; idea</strong></h2>");
    expect(result.html).toContain("<ul><li>First point</li><li>Second point</li></ul>");
    expect(result.html).not.toContain("javascript:");
    expect(result.text).toContain("A <clear> idea Read safely First point Second point");
  });
});
