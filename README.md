# x-blog-reader-skill

`x-blog-reader-skill` is a TypeScript CLI + skill contract to make X posts (and optionally threads) readable for coding agents such as Codex CLI, Claude Code, and Gemini-style CLIs.

## Why this repo exists

X post content is hard to consume in terminal-first workflows. This project normalizes an X status URL into readable markdown/text and structured JSON.

Example URL:

- `https://x.com/blackanger/status/2027345330505924638`

## Architecture

Provider priority:

1. `x-api` (official X API v2, token required)
2. `jina` (readability mirror fallback for full text)
3. `oembed` (official `publish.x.com/oembed`, last fallback)

This follows a reliability-first strategy: official API as primary, official oEmbed as degraded fallback.

## Quick start

```bash
npm install
npm run build
node dist/index.js read "https://x.com/blackanger/status/2027345330505924638" --mode auto --pretty
```

Development mode:

```bash
npm run dev -- read "https://x.com/blackanger/status/2027345330505924638" --mode auto --format markdown
```

Force mirror mode for full-text fallback:

```bash
npm run dev -- read "https://x.com/blackanger/status/2027345330505924638" --mode jina --format markdown
```

## CLI usage

```text
x-blog-reader read <x-status-url> [options]

Options:
  --mode <auto|api|jina|oembed>   Provider mode (default: auto)
  --thread                   Attempt thread expansion (API mode)
  --max-posts <number>       Max posts when thread is enabled (default: 40)
  --format <json|markdown|text>
  --pretty                   Pretty-print JSON
```

## Environment

Optional env var:

- `X_BEARER_TOKEN`: enables official X API mode (`--mode api` or `--mode auto` primary path).

See [.env.example](.env.example).

## Skill contract

Reusable skill entry:

- [skills/x-readable/SKILL.md](skills/x-readable/SKILL.md)

Output schema:

- [schemas/read-x-blog.output.schema.json](schemas/read-x-blog.output.schema.json)

## Test and verify

```bash
npm run typecheck
npm test
npm run build
```

## Legal and policy note

Use this tool in compliance with X terms, developer policies, and applicable law. For production-grade reliability and policy alignment, use official X API access.

See [DISCLAIMER.md](DISCLAIMER.md) for a full legal disclaimer.

If you are a rights holder or platform representative and believe any content or functionality in this repository infringes your rights or violates platform policy, please contact me at <your-email> with the relevant URL and details. I will review promptly and remove or disable material where appropriate.
