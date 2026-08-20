import type { Language } from "./context";

export function languageFromAcceptLanguage(value: string | null): Language {
  if (!value) return "en";

  const preferred = value
    .split(",")
    .map((part, index) => {
      const [range = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
      return { range: range.toLowerCase(), quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter(({ quality }) => quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .find(({ range }) => range === "ru" || range.startsWith("ru-") || range === "en" || range.startsWith("en-"));

  return preferred?.range === "ru" || preferred?.range.startsWith("ru-") ? "ru" : "en";
}

export function resolveLanguage(explicit: string | undefined, acceptLanguage: string | null): Language {
  if (explicit === "ru" || explicit === "en") return explicit;
  return languageFromAcceptLanguage(acceptLanguage);
}
