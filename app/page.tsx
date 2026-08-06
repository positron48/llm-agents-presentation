import TalkDeck from "./talk-deck";
import { bonusSlides, references, slides, talkMeta } from "@/content/generated";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; slide?: string }>;
}) {
  const params = await searchParams;

  return (
    <TalkDeck
      slides={slides}
      bonusSlides={bonusSlides}
      references={references}
      meta={talkMeta}
      initialMode={params.mode === "read" ? "read" : "slides"}
      initialSlideId={params.slide}
    />
  );
}
