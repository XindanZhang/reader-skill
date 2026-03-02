import { describe, expect, it } from "vitest";

import { stripHtml, wordCount } from "../src/utils/text.js";

describe("text utilities", () => {
  it("strips html and decodes entities", () => {
    const html = "<blockquote><p>Hello &amp; welcome<br>to X</p></blockquote>";
    expect(stripHtml(html)).toContain("Hello & welcome");
    expect(stripHtml(html)).toContain("to X");
  });

  it("counts words", () => {
    expect(wordCount("hello from x blog")).toBe(4);
  });
});
