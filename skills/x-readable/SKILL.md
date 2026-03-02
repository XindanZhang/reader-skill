---
name: x-readable
description: Read X post URLs into readable markdown/text/JSON for Codex, Claude Code, and Gemini-style CLIs.
---

# X Readable Skill

Use this skill whenever a user asks to read or summarize an X post URL such as:
- `https://x.com/<user>/status/<id>`

## Command

```bash
npx x-blog-reader read "<x-status-url>" --mode auto --format markdown
```

For structured output:

```bash
npx x-blog-reader read "<x-status-url>" --mode auto --format json --pretty
```

For thread expansion (best effort, requires API token):

```bash
X_BEARER_TOKEN=... npx x-blog-reader read "<x-status-url>" --mode api --thread --format markdown
```

## Behavior

1. Primary provider: official X API v2 (`--mode api` or `--mode auto` with token).
2. Secondary fallback: `r.jina.ai` readability mirror (`--mode jina` or automatic fallback).
3. Last fallback: official `publish.x.com/oembed`.
3. Output includes normalized URL, provider used, warnings, and LLM-friendly content.

## Notes

- For highest fidelity and near real-time reads, set `X_BEARER_TOKEN`.
- If API token is missing in `auto` mode, the command falls back to oEmbed.
- Respect X terms and policies when using this tool.
