import vinext from "vinext";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const execFileAsync = promisify(execFile);
const projectRoot = import.meta.dirname;

type EditableField = "kicker" | "title" | "subtitle" | "body" | "notes";

function updateSlideSource(
  source: string,
  slideId: string,
  field: EditableField,
  value: string,
) {
  const blocks = source.split("\n===\n");
  const index = blocks.findIndex((block) => block.startsWith(`---\nid: ${slideId}\n`));
  if (index < 0) throw new Error(`Slide ${slideId} was not found`);

  const block = blocks[index];
  const match = block.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Slide ${slideId} has invalid front matter`);
  let [, frontMatter, content] = match;

  if (field === "kicker" || field === "title" || field === "subtitle") {
    const line = new RegExp(`^${field}:.*$`, "m");
    if (line.test(frontMatter)) {
      frontMatter = frontMatter.replace(line, value ? `${field}: ${value}` : "");
    } else if (value) {
      frontMatter = `${frontMatter}\n${field}: ${value}`;
    }
    frontMatter = frontMatter.replace(/\n{2,}/g, "\n").trim();
  } else {
    const [body = "", notes = ""] = content.split(/\n?<!-- notes -->\n/);
    content = field === "body"
      ? `${value.trim()}\n\n<!-- notes -->\n\n${notes.trim()}`
      : `${body.trim()}\n\n<!-- notes -->\n\n${value.trim()}`;
  }

  blocks[index] = `---\n${frontMatter}\n---\n${content.trim()}\n`;
  return blocks.join("\n===\n");
}

function localTalkEditor(): Plugin {
  return {
    name: "local-talk-editor",
    apply: "serve" as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/local-talk-editor", async (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end("Method not allowed");
          return;
        }
        try {
          let body = "";
          for await (const chunk of request) body += chunk;
          const payload = JSON.parse(body) as {
            slideId?: string;
            track?: "core" | "bonus";
            field?: EditableField;
            value?: string;
            language?: "ru" | "en";
          };
          if (!payload.slideId || !payload.field || typeof payload.value !== "string") {
            throw new Error("slideId, field and value are required");
          }
          if (payload.value.length > 100_000) throw new Error("Text is too long");

          const language = payload.language === "en" ? "en" : "ru";
          const filename = payload.track === "bonus"
            ? `bonus-transformer.${language}.md`
            : `talk.${language}.md`;
          const sourcePath = path.join(projectRoot, "content", filename);
          const source = await readFile(sourcePath, "utf8");
          await writeFile(
            sourcePath,
            updateSlideSource(source, payload.slideId, payload.field, payload.value),
          );
          await execFileAsync(process.execPath, ["scripts/build-content.mjs"], {
            cwd: projectRoot,
          });
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.statusCode = 400;
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Unable to save the slide",
          }));
        }
      });
    },
  };
}

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      localTalkEditor(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
