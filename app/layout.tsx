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
