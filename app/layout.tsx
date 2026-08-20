import "./globals.css";
import { headers } from "next/headers";
import { languageFromAcceptLanguage } from "./i18n/language";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const language = languageFromAcceptLanguage(requestHeaders.get("accept-language"));

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "const l=new URLSearchParams(location.search).get('lang');if(l==='ru'||l==='en')document.documentElement.lang=l" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
