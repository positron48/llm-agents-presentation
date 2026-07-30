import type { Metadata } from "next";
import TalkDeck from "./talk-deck";
import { references, slides, talkMeta } from "@/content/generated";

export const metadata: Metadata = {
  title: "От нейрона к агенту",
  description:
    "Интерактивный доклад о LLM, современных моделях, инструментах и AI-агентах.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; slide?: string }>;
}) {
  const params = await searchParams;

  return (
    <TalkDeck
      slides={slides}
      references={references}
      totalMinutes={talkMeta.totalMinutes}
      initialMode={params.mode === "read" ? "read" : "slides"}
      initialSlideId={params.slide}
    />
  );
}
