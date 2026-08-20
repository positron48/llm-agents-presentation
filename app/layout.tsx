import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'ru'" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
