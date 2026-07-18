import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cairn — your AI learning companion",
  description:
    "Turn any article, document, or idea into a structured, adaptive course with AI tutoring, quizzes, and spaced review.",
  applicationName: "Cairn",
};

export const viewport = {
  themeColor: "#14503B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          // Sets the theme class before first paint to prevent a flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
