import { ReadError, ReadablePost } from "../types.js";

interface ApiTweet {
  id: string;
  text?: string;
  note_tweet?: {
    text?: string;
  };
  author_id?: string;
  conversation_id?: string;
  created_at?: string;
}

interface ApiUser {
  id: string;
  name?: string;
  username?: string;
}

interface LookupResponse {
  data?: ApiTweet;
  includes?: {
    users?: ApiUser[];
  };
  errors?: Array<{ detail?: string }>;
}

interface SearchResponse {
  data?: ApiTweet[];
  includes?: {
    users?: ApiUser[];
  };
  meta?: {
    next_token?: string;
  };
}

function tweetText(tweet: ApiTweet): string {
  return tweet.note_tweet?.text?.trim() || tweet.text?.trim() || "";
}

function readErrorFromResponse(status: number, body: string): ReadError {
  if (status === 401 || status === 403) {
    return new ReadError("AUTH_FAILED", `X API authentication failed (${status})`);
  }
  if (status === 429) {
    return new ReadError("RATE_LIMITED", "X API rate limited (429)", status);
  }
  return new ReadError("API_FAILED", `X API request failed (${status}): ${body.slice(0, 300)}`, status);
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw readErrorFromResponse(response.status, body);
  }

  return (await response.json()) as T;
}

function postFromTweet(tweet: ApiTweet, usersById: Map<string, ApiUser>): ReadablePost {
  const user = tweet.author_id ? usersById.get(tweet.author_id) : undefined;
  const username = user?.username ?? null;
  const url = username
    ? `https://x.com/${username}/status/${tweet.id}`
    : `https://x.com/i/web/status/${tweet.id}`;

  return {
    id: tweet.id,
    url,
    authorName: user?.name ?? null,
    authorUsername: username,
    createdAt: tweet.created_at ?? null,
    text: tweetText(tweet)
  };
}

export async function fetchRootPost(statusId: string, token: string): Promise<{ post: ReadablePost; conversationId: string | null }> {
  const params = new URLSearchParams({
    "tweet.fields": "note_tweet,conversation_id,author_id,created_at",
    expansions: "author_id",
    "user.fields": "username,name"
  });

  const url = `https://api.x.com/2/tweets/${statusId}?${params.toString()}`;
  const json = await fetchJson<LookupResponse>(url, token);

  if (!json.data) {
    const detail = json.errors?.[0]?.detail ?? "Unknown error";
    throw new ReadError("API_FAILED", `X API returned no data: ${detail}`);
  }

  const usersById = new Map((json.includes?.users ?? []).map((user) => [user.id, user]));

  return {
    post: postFromTweet(json.data, usersById),
    conversationId: json.data.conversation_id ?? null
  };
}

export async function fetchConversationPosts(
  conversationId: string,
  authorUsername: string | null,
  token: string,
  maxPosts: number
): Promise<ReadablePost[]> {
  const posts: ReadablePost[] = [];
  let nextToken: string | undefined;

  while (posts.length < maxPosts) {
    const query = authorUsername
      ? `conversation_id:${conversationId} from:${authorUsername}`
      : `conversation_id:${conversationId}`;

    const params = new URLSearchParams({
      query,
      max_results: String(Math.min(100, maxPosts)),
      "tweet.fields": "note_tweet,conversation_id,author_id,created_at",
      expansions: "author_id",
      "user.fields": "username,name"
    });

    if (nextToken) {
      params.set("next_token", nextToken);
    }

    const url = `https://api.x.com/2/tweets/search/recent?${params.toString()}`;
    const json = await fetchJson<SearchResponse>(url, token);

    const usersById = new Map((json.includes?.users ?? []).map((user) => [user.id, user]));
    for (const tweet of json.data ?? []) {
      posts.push(postFromTweet(tweet, usersById));
      if (posts.length >= maxPosts) {
        break;
      }
    }

    nextToken = json.meta?.next_token;
    if (!nextToken) {
      break;
    }
  }

  return posts;
}
