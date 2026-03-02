import { ReadablePost } from "../types.js";

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&mdash;": "-"
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp|mdash);/g, (m) => ENTITY_MAP[m] ?? m);
}

export function stripHtml(html: string): string {
  const withoutTags = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withoutTags)
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function wordCount(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

export function postsToMarkdown(posts: ReadablePost[]): string {
  return posts
    .map((post, index) => {
      const author = post.authorUsername ? `@${post.authorUsername}` : "@unknown";
      const time = post.createdAt ? ` (${post.createdAt})` : "";
      return `### ${index + 1}. ${author}${time}\n\n${post.text}`;
    })
    .join("\n\n");
}

export function postsToText(posts: ReadablePost[]): string {
  return posts
    .map((post, index) => {
      const author = post.authorUsername ? `@${post.authorUsername}` : "@unknown";
      return `[${index + 1}] ${author}\n${post.text}`;
    })
    .join("\n\n");
}
