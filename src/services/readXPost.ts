import { fetchConversationPosts, fetchRootPost } from "../providers/xApiProvider.js";
import { fetchJinaReadablePost } from "../providers/jinaProvider.js";
import { fetchOEmbedPost } from "../providers/oembedProvider.js";
import { parseXStatusUrl } from "../url.js";
import { ReadError, ReadOptions, ReadResult, ReadablePost } from "../types.js";
import { postsToMarkdown, postsToText, wordCount } from "../utils/text.js";

function buildResult(
  inputUrl: string,
  canonicalUrl: string,
  mode: ReadOptions["mode"],
  includeThread: boolean,
  maxPosts: number,
  provider: "x-api" | "jina" | "oembed",
  posts: ReadablePost[],
  warnings: string[]
): ReadResult {
  const markdown = postsToMarkdown(posts);
  const text = postsToText(posts);
  const author = posts[0]?.authorUsername ? `@${posts[0].authorUsername}` : "unknown";

  return {
    schemaVersion: "1.0.0",
    fetchedAt: new Date().toISOString(),
    provider,
    request: {
      inputUrl,
      canonicalUrl,
      mode,
      includeThread,
      maxPosts
    },
    summary: {
      posts: posts.length,
      words: wordCount(text)
    },
    content: {
      title: `X readable post (${author})`,
      markdown,
      text
    },
    posts,
    warnings
  };
}

function dedupeAndSortPosts(posts: ReadablePost[]): ReadablePost[] {
  const byId = new Map<string, ReadablePost>();
  for (const post of posts) {
    byId.set(post.id, post);
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (!a.createdAt && !b.createdAt) {
      return 0;
    }
    if (!a.createdAt) {
      return -1;
    }
    if (!b.createdAt) {
      return 1;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function readXPost(inputUrl: string, options: ReadOptions): Promise<ReadResult> {
  const normalized = parseXStatusUrl(inputUrl);
  const warnings: string[] = [];
  const token = process.env.X_BEARER_TOKEN;

  if (options.mode === "api" && !token) {
    throw new ReadError("MISSING_TOKEN", "X_BEARER_TOKEN is required when --mode api is selected.");
  }

  if (options.mode !== "oembed" && options.mode !== "jina" && token) {
    try {
      const root = await fetchRootPost(normalized.statusId, token);
      const posts: ReadablePost[] = [root.post];

      if (options.includeThread && root.conversationId) {
        try {
          const threadPosts = await fetchConversationPosts(
            root.conversationId,
            root.post.authorUsername,
            token,
            options.maxPosts
          );
          posts.push(...threadPosts);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          warnings.push(`Thread expansion failed, returning root post only: ${message}`);
        }
      }

      return buildResult(
        inputUrl,
        normalized.canonicalUrl,
        options.mode,
        options.includeThread,
        options.maxPosts,
        "x-api",
        dedupeAndSortPosts(posts).slice(0, options.maxPosts),
        warnings
      );
    } catch (error) {
      if (options.mode === "api") {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`X API provider failed. Falling back to alternate provider: ${message}`);
    }
  } else if (options.mode === "auto") {
    warnings.push("X_BEARER_TOKEN not set. Falling back to mirror/oEmbed providers.");
  }

  if (options.mode === "jina" || options.mode === "auto") {
    try {
      const jinaPost = await fetchJinaReadablePost(
        normalized.canonicalUrl,
        normalized.statusId,
        normalized.username
      );

      if (options.mode === "auto") {
        warnings.push("Using Jina mirror fallback. For highest fidelity, configure X_BEARER_TOKEN.");
      }

      return buildResult(
        inputUrl,
        normalized.canonicalUrl,
        options.mode,
        options.includeThread,
        options.maxPosts,
        "jina",
        [jinaPost],
        warnings
      );
    } catch (error) {
      if (options.mode === "jina") {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Jina fallback failed. Falling back to oEmbed: ${message}`);
    }
  }

  const oembedPost = await fetchOEmbedPost(normalized.canonicalUrl, normalized.statusId);
  return buildResult(
    inputUrl,
    normalized.canonicalUrl,
    options.mode,
    options.includeThread,
    options.maxPosts,
    "oembed",
    [oembedPost],
    warnings
  );
}
