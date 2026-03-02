import { describe, expect, it } from "vitest";

import { parseXStatusUrl } from "../src/url.js";

describe("parseXStatusUrl", () => {
  it("parses standard x.com status URL", () => {
    const parsed = parseXStatusUrl("https://x.com/blackanger/status/2027345330505924638");
    expect(parsed.statusId).toBe("2027345330505924638");
    expect(parsed.username).toBe("blackanger");
    expect(parsed.canonicalUrl).toBe("https://x.com/blackanger/status/2027345330505924638");
  });

  it("supports twitter.com host", () => {
    const parsed = parseXStatusUrl("https://twitter.com/blackanger/status/2027345330505924638");
    expect(parsed.statusId).toBe("2027345330505924638");
    expect(parsed.username).toBe("blackanger");
  });

  it("rejects unsupported host", () => {
    expect(() => parseXStatusUrl("https://example.com/blackanger/status/2027345330505924638")).toThrow(
      "Unsupported host"
    );
  });
});
