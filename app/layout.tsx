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
    <html lang="en">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
