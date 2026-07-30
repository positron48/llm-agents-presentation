import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the presentation shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>От нейрона к агенту<\/title>/i);
  assert.match(html, /От нейрона к агенту/);
  assert.match(html, /Читать текст/);
  assert.match(html, /Обзор/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("client includes the reading mode, notes and bibliography", async () => {
  const source = await readFile(
    new URL("../app/talk-deck.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Текст доклада/);
  assert.match(source, /speaker-copy/);
  assert.match(source, /Библиография/);
  assert.match(source, /initialMode = "slides"/);
});

test("content is editable Markdown and keeps the 40-minute budget", async () => {
  const [markdown, generated, references] = await Promise.all([
    readFile(new URL("../content/talk.ru.md", import.meta.url), "utf8"),
    readFile(new URL("../content/generated.ts", import.meta.url), "utf8"),
    readFile(new URL("../content/references.json", import.meta.url), "utf8"),
  ]);

  assert.match(markdown, /<!-- notes -->/);
  assert.match(generated, /"totalMinutes": 40/);
  assert.match(generated, /"id": "setup"/);
  assert.equal(JSON.parse(references).length, 19);
});
