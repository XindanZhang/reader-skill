import { NormalizedXUrl, ReadError } from "./types.js";

const SUPPORTED_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com"
]);

const USER_STATUS_PATH = /^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/;
const I_WEB_STATUS_PATH = /^\/i\/web\/status\/(\d+)/;

export function parseXStatusUrl(inputUrl: string): NormalizedXUrl {
  let url: URL;
  try {
    url = new URL(inputUrl);
  } catch {
    throw new ReadError("INVALID_URL", `Invalid URL: ${inputUrl}`);
  }

  const host = url.hostname.toLowerCase();
  if (!SUPPORTED_HOSTS.has(host)) {
    throw new ReadError("INVALID_URL", `Unsupported host: ${host}`);
  }

  const path = url.pathname;
  const userMatch = path.match(USER_STATUS_PATH);
  if (userMatch) {
    const username = userMatch[1];
    const statusId = userMatch[2];
    return {
      inputUrl,
      host,
      username,
      statusId,
      canonicalUrl: `https://x.com/${username}/status/${statusId}`
    };
  }

  const iWebMatch = path.match(I_WEB_STATUS_PATH);
  if (iWebMatch) {
    const statusId = iWebMatch[1];
    return {
      inputUrl,
      host,
      username: null,
      statusId,
      canonicalUrl: `https://x.com/i/web/status/${statusId}`
    };
  }

  throw new ReadError("INVALID_URL", `URL does not look like an X status URL: ${inputUrl}`);
}
