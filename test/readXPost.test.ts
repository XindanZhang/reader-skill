import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readXPost } from "../src/services/readXPost.js";

const SAMPLE_URL = "https://x.com/blackanger/status/2027345330505924638";
const originalFetch = globalThis.fetch;

describe("readXPost", () => {
  beforeEach(() => {
    delete process.env.X_BEARER_TOKEN;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("falls back to jina in auto mode when token is missing", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(requestUrl.startsWith("https://r.jina.ai/http://x.com/blackanger/status/")).toBe(true);

      return new Response(
        "Title: sample\n\nMarkdown Content:\nLong readable content from mirror",
        { status: 200 }
      );
    }) as typeof fetch;

    const result = await readXPost(SAMPLE_URL, {
      mode: "auto",
      includeThread: false,
      maxPosts: 40
    });

    expect(result.provider).toBe("jina");
    expect(result.posts).toHaveLength(1);
    expect(result.content.text).toContain("Long readable content from mirror");
  });

  it("falls back to oEmbed when jina fails", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("mirror failure", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            author_name: "blackanger",
            author_url: "https://x.com/blackanger",
            html: "<blockquote><p>Readable X blog content</p></blockquote>"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      );

    globalThis.fetch = mockFetch as typeof fetch;

    const result = await readXPost(SAMPLE_URL, {
      mode: "auto",
      includeThread: false,
      maxPosts: 40
    });

    expect(result.provider).toBe("oembed");
    expect(result.content.text).toContain("Readable X blog content");
    expect(result.warnings.some((warning) => warning.includes("Jina fallback failed"))).toBe(true);
  });

  it("requires token in api mode", async () => {
    await expect(
      readXPost(SAMPLE_URL, {
        mode: "api",
        includeThread: true,
        maxPosts: 40
      })
    ).rejects.toThrow("X_BEARER_TOKEN is required");
  });
});
