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
  assert.match(html, /Скрыть панели/);
  assert.match(html, /Номер текущего слайда: 01/);
  assert.match(html, /src="\/og\.png"/);
  assert.doesNotMatch(html, /_vinext\/image/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("client includes the reading mode, notes and bibliography", async () => {
  const source = await readFile(
    new URL("../app/talk-deck.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /meta\.kicker/);
  assert.match(source, /speaker-copy/);
  assert.match(source, /Библиография/);
  assert.match(source, /initialMode = "slides"/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "h"/);
  assert.match(source, /chrome-reveal/);
  assert.match(source, /slide\.visual !== "hero"/);
});

test("content is editable Markdown and keeps bonus slides outside the core talk", async () => {
  const [markdown, bonusMarkdown, generated, references, visuals, tokenSamples] = await Promise.all([
    readFile(new URL("../content/talk.ru.md", import.meta.url), "utf8"),
    readFile(new URL("../content/bonus-transformer.ru.md", import.meta.url), "utf8"),
    readFile(new URL("../content/generated.ts", import.meta.url), "utf8"),
    readFile(new URL("../content/references.json", import.meta.url), "utf8"),
    readFile(new URL("../content/visuals.ru.json", import.meta.url), "utf8"),
    readFile(new URL("../content/token-samples.ru.json", import.meta.url), "utf8"),
  ]);

  assert.match(markdown, /<!-- notes -->/);
  assert.match(bonusMarkdown, /id: transformer-route/);
  assert.match(bonusMarkdown, /id: generation/);
  assert.match(markdown, /brand: LLM \/ AGENTS/);
  assert.match(generated, /"totalMinutes": 63/);
  assert.match(generated, /"slideCount": 37/);
  assert.match(generated, /"id": "learning"/);
  assert.match(generated, /"id": "agent-loop"/);
  assert.match(generated, /"id": "model-lines"/);
  assert.match(generated, /"id": "model-product"/);
  assert.match(generated, /"id": "model-snapshot"/);
  assert.match(generated, /"id": "capabilities-today"/);
  assert.match(generated, /"id": "capability-artifacts"/);
  assert.match(generated, /"id": "capability-research"/);
  assert.match(generated, /"id": "modalities"/);
  assert.match(generated, /"id": "chat-tools"/);
  assert.match(generated, /"id": "agent-use-cases"/);
  assert.match(generated, /"id": "non-code-agent"/);
  assert.match(generated, /"id": "agent-work-inbox"/);
  assert.match(generated, /"id": "agent-autonomy"/);
  assert.match(generated, /"id": "effort-evolution"/);
  assert.match(generated, /"id": "work-future"/);
  assert.match(generated, /"id": "industry-next"/);
  assert.match(generated, /export const bonusSlides/);
  assert.match(generated, /"id": "generation"/);
  assert.match(generated, /"id": "biological-neuron"/);
  assert.match(generated, /"id": "context-input"/);
  assert.match(generated, /"id": "context-relations"/);
  assert.match(generated, /"id": "effort-simple"/);
  assert.match(generated, /"id": "effort-complex"/);
  assert.match(generated, /"bonusSlideCount": 38/);
  assert.match(generated, /"id": "transformer-summary"/);
  assert.match(generated, /"id": "kv-cache"/);
  assert.match(generated, /"id": "setup"/);
  assert.equal(JSON.parse(references).length, 51);
  assert.equal(JSON.parse(visuals).training.length, 4);
  assert.equal(JSON.parse(tokenSamples).length, 3);
});
