import uiEnglish from "@/content/ui.en.json";

const entries = Object.entries(uiEnglish).sort(([left], [right]) => right.length - left.length);

export function translateUiText(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length || undefined);
  const exact = uiEnglish[core as keyof typeof uiEnglish];
  if (exact) return `${leading}${exact}${trailing}`;

  let translated = value;
  for (const [russian, english] of entries) {
    if (translated.includes(russian)) translated = translated.replaceAll(russian, english);
  }
  return translated;
}
