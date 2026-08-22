import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TalkDeck from "../../app/talk-deck";
import { resolveLanguage } from "../../app/i18n/language";
import { contentByLanguage } from "../../content/generated";
import "../../app/globals.css";

const params = new URLSearchParams(window.location.search);
const language = resolveLanguage(
  params.get("lang") ?? undefined,
  navigator.languages?.join(",") ?? navigator.language,
);
const { slides, bonusSlides, references, talkMeta } = contentByLanguage[language];
const requestedSlide = params.get("slide") ?? undefined;

document.documentElement.lang = language;
document.title = talkMeta.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute("content", talkMeta.description);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TalkDeck
      slides={slides}
      bonusSlides={bonusSlides}
      references={references}
      meta={talkMeta}
      initialMode={params.get("mode") === "read" ? "read" : "slides"}
      initialSlideId={requestedSlide}
      language={language}
    />
  </StrictMode>,
);
