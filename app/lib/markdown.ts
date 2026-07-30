export type Reference = {
  id: number;
  title: string;
  publisher: string;
  year: string;
  url: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(value: string, references: readonly Reference[]) {
  const referenceMap = new Map(references.map((reference) => [reference.id, reference]));
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(\d+)\]/g, (_, rawId) => {
      const id = Number(rawId);
      const reference = referenceMap.get(id);
      if (!reference) return `[${id}]`;
      return `<a class="citation" href="${reference.url}" target="_blank" rel="noreferrer" aria-label="Источник ${id}: ${escapeHtml(reference.title)}">[${id}]</a>`;
    });
}

export function renderMarkdown(
  markdown: string,
  references: readonly Reference[],
) {
  const blocks = markdown.trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((line) => /^-\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => `<li>${renderInline(line.replace(/^-\s+/, ""), references)}</li>`)
          .join("")}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return `<ol>${lines
          .map((line) => `<li>${renderInline(line.replace(/^\d+\.\s+/, ""), references)}</li>`)
          .join("")}</ol>`;
      }
      return `<p>${renderInline(block, references).replace(/\s{2}\n/g, "<br />").replace(/\n/g, " ")}</p>`;
    })
    .join("");
}

export function citationIds(markdown: string) {
  return Array.from(markdown.matchAll(/\[(\d+)\]/g), (match) => Number(match[1]))
    .filter((id, index, values) => values.indexOf(id) === index)
    .sort((a, b) => a - b);
}
