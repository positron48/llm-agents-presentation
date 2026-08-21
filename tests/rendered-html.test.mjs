import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", requestHeaders = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", host: "localhost", ...requestHeaders },
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
  const response = await render("/", { "accept-language": "ru-RU,ru;q=0.9,en;q=0.8" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>От нейрона к агенту<\/title>/i);
  assert.match(html, /От нейрона к агенту/);
  assert.match(html, /Читать текст/);
  assert.match(html, /Обзор/);
  assert.match(html, /Скрыть панели/);
  assert.doesNotMatch(html, /Редактировать текст/);
  assert.match(html, /Номер текущего слайда: 01/);
  assert.match(html, /src="\/og\.png"/);
  assert.doesNotMatch(html, /_vinext\/image/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders English content and the localized cover", async () => {
  const response = await render("/?lang=en");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>From neuron to agent<\/title>/i);
  assert.match(html, /From neuron to agent/);
  assert.match(html, /src="\/og\.en\.png"/);
  assert.match(html, /href="\?lang=ru&amp;slide=cover"[^>]*lang="ru"/);

  const readingResponse = await render("/?lang=en&mode=read");
  const readingHtml = await readingResponse.text();
  assert.match(readingHtml, /src="\/outcome-over-implementation\.en\.png"/);
  assert.match(readingHtml, /src="\/human-ai-complexity\.en\.png"/);
  assert.match(readingHtml, /Hide panels/);
});

test("selects the language from Accept-Language unless the URL overrides it", async () => {
  const russianResponse = await render("/", { "accept-language": "en;q=0.7,ru-RU;q=0.9" });
  assert.match(await russianResponse.text(), /<title>От нейрона к агенту<\/title>/i);

  const englishResponse = await render("/", { "accept-language": "de-DE,de;q=0.9" });
  assert.match(await englishResponse.text(), /<title>From neuron to agent<\/title>/i);

  const explicitRussianResponse = await render("/?lang=ru", { "accept-language": "en-US,en;q=0.9" });
  assert.match(await explicitRussianResponse.text(), /<title>От нейрона к агенту<\/title>/i);
});

test("client includes the reading mode, notes and bibliography", async () => {
  const [source, viteConfig] = await Promise.all([
    readFile(new URL("../app/talk-deck.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(source, /meta\.kicker/);
  assert.match(source, /speaker-copy/);
  assert.match(source, /Библиография/);
  assert.match(source, /initialMode = "slides"/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "h"/);
  assert.match(source, /target\?\.matches\("input, select, textarea"\)/);
  assert.doesNotMatch(source, /matches\("input, select, textarea, button"\)/);
  assert.match(source, /event\.key === "ArrowDown"/);
  assert.match(source, /event\.key === "ArrowUp"/);
  assert.match(source, /event\.key === " " && !target\?\.matches\("button"\)/);
  assert.match(source, /chrome-reveal/);
  assert.match(source, /slide\.visual !== "hero"/);
  assert.match(source, /process\.env\.NODE_ENV !== "production"/);
  assert.match(source, /LanguageContext\.Provider/);
  assert.match(source, /bonus-route-cta/);
  assert.doesNotMatch(source, /MutationObserver|localizeElement/);
  assert.match(source, /contentEditable=\{editing\}/);
  assert.match(source, /slide\.subtitle \|\| isEditing/);
  assert.match(source, /editable-subtitle/);
  assert.match(source, /\/api\/local-talk-editor/);
  assert.match(viteConfig, /apply: "serve"/);
  assert.match(viteConfig, /content", filename/);
});

test("content is editable Markdown and keeps bonus slides outside the core talk", async () => {
  const [markdown, englishMarkdown, bonusMarkdown, englishBonusMarkdown, generated, generator, references, englishReferences, visuals, tokenSamples, uiEnglish] = await Promise.all([
    readFile(new URL("../content/talk.ru.md", import.meta.url), "utf8"),
    readFile(new URL("../content/talk.en.md", import.meta.url), "utf8"),
    readFile(new URL("../content/bonus-transformer.ru.md", import.meta.url), "utf8"),
    readFile(new URL("../content/bonus-transformer.en.md", import.meta.url), "utf8"),
    readFile(new URL("../content/generated.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-content.mjs", import.meta.url), "utf8"),
    readFile(new URL("../content/references.json", import.meta.url), "utf8"),
    readFile(new URL("../content/references.en.json", import.meta.url), "utf8"),
    readFile(new URL("../content/visuals.ru.json", import.meta.url), "utf8"),
    readFile(new URL("../content/token-samples.ru.json", import.meta.url), "utf8"),
    readFile(new URL("../content/ui.en.json", import.meta.url), "utf8"),
  ]);

  assert.match(markdown, /<!-- notes -->/);
  assert.doesNotMatch(generator, /\["id", "section", "title", "visual", "minutes"\]/);
  assert.match(bonusMarkdown, /id: transformer-route/);
  assert.match(bonusMarkdown, /id: generation/);
  assert.match(englishMarkdown, /title: From neuron to agent/);
  assert.match(englishBonusMarkdown, /id: generation/);
  assert.doesNotMatch(englishMarkdown, /[А-Яа-яЁё]/);
  assert.doesNotMatch(englishBonusMarkdown, /[А-Яа-яЁё]/);
  assert.match(markdown, /brand: LLM \/ AGENTS/);
  assert.match(generated, /"totalMinutes": 49/);
  assert.match(generated, /"slideCount": 31/);
  assert.match(generated, /"id": "learning"/);
  assert.doesNotMatch(generated, /"id": "agent-loop"/);
  assert.match(generated, /"id": "model-lines"/);
  assert.match(generated, /"id": "model-product"/);
  assert.match(generated, /"id": "model-product"[\s\S]*"id": "harness"[\s\S]*"id": "agent-skills"[\s\S]*"id": "agent-mcp"[\s\S]*"id": "agent-use-cases"[\s\S]*"id": "retrospective"/);
  assert.doesNotMatch(generated, /"id": "agent-subagents"/);
  assert.match(generated, /"id": "retrospective"/);
  assert.match(generated, /"id": "capability-artifacts"/);
  assert.match(generated, /"id": "capability-artifacts"[\s\S]*"id": "security-control"[\s\S]*"id": "model-lines"/);
  assert.doesNotMatch(generated, /"id": "capability-research"/);
  assert.doesNotMatch(generated, /"id": "modalities"/);
  assert.doesNotMatch(generated, /"id": "tools"/);
  assert.doesNotMatch(generated, /"id": "chat-tools"/);
  assert.match(generated, /"id": "context"[\s\S]*"id": "post-training"/);
  assert.match(generated, /"id": "agent-use-cases"/);
  assert.doesNotMatch(generated, /"id": "non-code-agent"/);
  assert.doesNotMatch(generated, /"id": "agent-work-inbox"/);
  assert.doesNotMatch(generated, /"id": "agent-autonomy"/);
  assert.doesNotMatch(generated, /"id": "effort-evolution"/);
  assert.match(generated, /"id": "work-future"/);
  assert.match(generated, /"id": "setup-plan"[\s\S]*"id": "agent-search"[\s\S]*"id": "outcome-over-implementation"[\s\S]*"id": "work-future"[\s\S]*"id": "automation-boundary"[\s\S]*"id": "human-ai-complexity"/);
  assert.match(generated, /"id": "outcome-over-implementation"[\s\S]*?"body": "",[\s\S]*?"notes": "Переходим к заключительной части/);
  assert.doesNotMatch(generated, /"id": "trajectory"/);
  assert.doesNotMatch(generated, /"id": "industry-next"/);
  assert.doesNotMatch(generated, /"id": "skills"/);
  assert.doesNotMatch(generated, /"id": "finale"/);
  assert.match(generated, /export const bonusSlides/);
  assert.match(generated, /"id": "generation"/);
  assert.match(generated, /"id": "biological-neuron"/);
  assert.doesNotMatch(generated, /"id": "context-input"/);
  assert.match(generated, /"id": "context-relations"/);
  assert.match(generated, /"id": "effort-simple"/);
  assert.match(generated, /"id": "effort-complex"/);
  assert.match(generated, /"id": "setup-flow"[\s\S]*"id": "setup-docs"[\s\S]*"id": "setup-plan"/);
  assert.match(generated, /"bonusSlideCount": 38/);
  assert.match(generated, /"id": "transformer-summary"/);
  assert.match(generated, /"id": "kv-cache"/);
  assert.doesNotMatch(generated, /"id": "setup"/);
  assert.equal(JSON.parse(references).length, 63);
  assert.equal(JSON.parse(englishReferences).length, 63);
  assert.equal(JSON.parse(uiEnglish).Русский, "Russian");
  assert.equal(JSON.parse(uiEnglish)["Таск трекер"], "Task tracker");
  assert.equal(JSON.parse(uiEnglish)["Выбираю задачу"], "Choose a task");
  assert.match(visuals, /"title": "Выбираю задачу", "note": "Таск трекер"/);
  assert.doesNotMatch(`${markdown}\n${englishMarkdown}\n${visuals}`, /Planka/i);
  assert.equal(JSON.parse(visuals).training.length, 4);
  assert.equal(JSON.parse(visuals).harness.rows.length, 10);
  assert.equal(JSON.parse(tokenSamples).length, 3);
});
