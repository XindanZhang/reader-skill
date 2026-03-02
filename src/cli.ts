import { readXPost } from "./services/readXPost.js";
import { OutputFormat, ProviderMode, ReadError } from "./types.js";

interface ParsedArgs {
  command: "read";
  url: string;
  mode: ProviderMode;
  includeThread: boolean;
  maxPosts: number;
  format: OutputFormat;
  pretty: boolean;
}

function printHelp(): void {
  const help = `x-blog-reader

Usage:
  x-blog-reader read <x-status-url> [options]

Options:
  --mode <auto|api|jina|oembed>   Provider mode (default: auto)
  --thread                   Attempt thread expansion (API mode)
  --max-posts <number>       Max posts to return when thread enabled (default: 40)
  --format <json|markdown|text>
  --pretty                   Pretty-print JSON output
  -h, --help                 Show help

Examples:
  x-blog-reader read "https://x.com/blackanger/status/2027345330505924638"
  x-blog-reader read "https://x.com/blackanger/status/2027345330505924638" --thread --mode api --format markdown
  x-blog-reader read "https://x.com/blackanger/status/2027345330505924638" --mode jina --format markdown
`;

  process.stdout.write(help);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    throw new ReadError("HELP_SHOWN", "Help shown");
  }

  const command = args[0];
  if (command !== "read") {
    throw new ReadError("INVALID_ARGS", `Unknown command: ${command}`);
  }

  const url = args[1];
  if (!url || url.startsWith("--")) {
    throw new ReadError("INVALID_ARGS", "A status URL is required: x-blog-reader read <url>");
  }

  let mode: ProviderMode = "auto";
  let includeThread = false;
  let maxPosts = 40;
  let format: OutputFormat = "json";
  let pretty = false;

  for (let i = 2; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--mode") {
      const value = args[i + 1] as ProviderMode | undefined;
      if (!value || !["auto", "api", "jina", "oembed"].includes(value)) {
        throw new ReadError("INVALID_ARGS", "--mode must be one of: auto, api, jina, oembed");
      }
      mode = value;
      i += 1;
      continue;
    }

    if (arg === "--thread") {
      includeThread = true;
      continue;
    }

    if (arg === "--max-posts") {
      const value = Number(args[i + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new ReadError("INVALID_ARGS", "--max-posts must be a positive integer");
      }
      maxPosts = value;
      i += 1;
      continue;
    }

    if (arg === "--format") {
      const value = args[i + 1] as OutputFormat | undefined;
      if (!value || !["json", "markdown", "text"].includes(value)) {
        throw new ReadError("INVALID_ARGS", "--format must be one of: json, markdown, text");
      }
      format = value;
      i += 1;
      continue;
    }

    if (arg === "--pretty") {
      pretty = true;
      continue;
    }

    throw new ReadError("INVALID_ARGS", `Unknown option: ${arg}`);
  }

  return {
    command: "read",
    url,
    mode,
    includeThread,
    maxPosts,
    format,
    pretty
  };
}

function exitCodeFromError(error: unknown): number {
  if (error instanceof ReadError) {
    if (error.code === "HELP_SHOWN") {
      return 0;
    }
    if (error.code === "INVALID_ARGS" || error.code === "INVALID_URL") {
      return 6;
    }
    if (error.code === "MISSING_TOKEN") {
      return 6;
    }
    return 5;
  }
  return 10;
}

export async function runCli(argv = process.argv): Promise<number> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    const code = exitCodeFromError(error);
    if (code !== 0) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
    }
    return code;
  }

  try {
    const result = await readXPost(parsed.url, {
      mode: parsed.mode,
      includeThread: parsed.includeThread,
      maxPosts: parsed.maxPosts
    });

    if (parsed.format === "json") {
      const json = parsed.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
      process.stdout.write(`${json}\n`);
      return 0;
    }

    if (parsed.format === "markdown") {
      process.stdout.write(`${result.content.markdown}\n`);
      return 0;
    }

    process.stdout.write(`${result.content.text}\n`);
    return 0;
  } catch (error) {
    const code = exitCodeFromError(error);
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    return code;
  }
}
