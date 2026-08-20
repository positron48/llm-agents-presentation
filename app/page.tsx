import TalkDeck from "./talk-deck";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { contentByLanguage } from "@/content/generated";
import { resolveLanguage } from "./i18n/language";

type PageParams = { mode?: string; slide?: string; lang?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const requestHeaders = await headers();
  const language = resolveLanguage(params.lang, requestHeaders.get("accept-language"));
  const { talkMeta } = contentByLanguage[language];
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ?? (host ? `${protocol}://${host}` : "http://localhost:3000");
  const image = `${origin}/${language === "en" ? "og.en.png" : "og.png"}`;
  return {
    title: talkMeta.title,
    description: talkMeta.description,
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
    openGraph: {
      title: talkMeta.title,
      description: talkMeta.description,
      type: "website",
      images: [{ url: image, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title: talkMeta.title,
      description: talkMeta.description,
      images: [image],
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const language = resolveLanguage(params.lang, requestHeaders.get("accept-language"));
  const { slides, bonusSlides, references, talkMeta } = contentByLanguage[language];

  return (
    <TalkDeck
      slides={slides}
      bonusSlides={bonusSlides}
      references={references}
      meta={talkMeta}
      initialMode={params.mode === "read" ? "read" : "slides"}
      initialSlideId={params.slide}
      language={language}
    />
  );
}
