import type { Metadata } from "next";
import { headers } from "next/headers";
import { talkMeta } from "@/content/generated";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const image = `${origin}/og.png`;

  return {
    title: talkMeta.title,
    description: talkMeta.description,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
