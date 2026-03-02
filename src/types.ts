export type ProviderMode = "auto" | "api" | "jina" | "oembed";
export type OutputFormat = "json" | "markdown" | "text";

export interface NormalizedXUrl {
  inputUrl: string;
  host: string;
  username: string | null;
  statusId: string;
  canonicalUrl: string;
}

export interface ReadOptions {
  mode: ProviderMode;
  includeThread: boolean;
  maxPosts: number;
}

export interface ReadablePost {
  id: string;
  url: string;
  authorName: string | null;
  authorUsername: string | null;
  createdAt: string | null;
  text: string;
}

export interface ReadResult {
  schemaVersion: "1.0.0";
  fetchedAt: string;
  provider: "x-api" | "jina" | "oembed";
  request: {
    inputUrl: string;
    canonicalUrl: string;
    mode: ProviderMode;
    includeThread: boolean;
    maxPosts: number;
  };
  summary: {
    posts: number;
    words: number;
  };
  content: {
    title: string;
    markdown: string;
    text: string;
  };
  posts: ReadablePost[];
  warnings: string[];
}

export class ReadError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ReadError";
    this.code = code;
    this.status = status;
  }
}
