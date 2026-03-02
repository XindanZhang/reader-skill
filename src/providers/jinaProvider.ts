import { ReadError, ReadablePost } from "../types.js";

function extractMarkdown(raw: string): string {
  const marker = "Markdown Content:";
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) {
    return raw.trim();
  }

  return raw.slice(markerIndex + marker.length).trim();
}

export async function fetchJinaReadablePost(canonicalUrl: string, statusId: string, username: string | null): Promise<ReadablePost> {
  const jinaUrl = `https://r.jina.ai/http://${canonicalUrl.replace(/^https?:\/\//, "")}`;
  const response = await fetch(jinaUrl);

  if (!response.ok) {
    const body = await response.text();
    throw new ReadError("JINA_FAILED", `Jina mirror request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const markdown = extractMarkdown(await response.text());
  if (!markdown) {
    throw new ReadError("JINA_FAILED", "Jina mirror returned empty content");
  }

  return {
    id: statusId,
    url: canonicalUrl,
    authorName: null,
    authorUsername: username,
    createdAt: null,
    text: markdown
  };
}
