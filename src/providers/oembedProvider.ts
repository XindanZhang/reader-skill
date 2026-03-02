import { ReadError, ReadablePost } from "../types.js";
import { stripHtml } from "../utils/text.js";

interface OEmbedResponse {
  author_name?: string;
  author_url?: string;
  html?: string;
}

export async function fetchOEmbedPost(statusUrl: string, statusId: string): Promise<ReadablePost> {
  const params = new URLSearchParams({
    url: statusUrl,
    omit_script: "true"
  });

  const url = `https://publish.x.com/oembed?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new ReadError("OEMBED_FAILED", `oEmbed request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const json = (await response.json()) as OEmbedResponse;
  const text = stripHtml(json.html ?? "");
  const authorUsername = json.author_url?.split("/").filter(Boolean).pop() ?? null;

  return {
    id: statusId,
    url: statusUrl,
    authorName: json.author_name ?? null,
    authorUsername,
    createdAt: null,
    text
  };
}
