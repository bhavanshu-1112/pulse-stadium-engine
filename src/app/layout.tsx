import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pulse AI Engine — FIFA World Cup 2026 Stadium Operations",
  description:
    "GenAI-powered stadium operations and crowd management platform for FIFA World Cup 2026. Real-time telemetry analysis, SOP-driven crowd redirection, and bilingual fan communication powered by Gemini AI.",
  keywords: ["FIFA", "World Cup 2026", "Stadium Operations", "GenAI", "Crowd Management", "Gemini AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip-to-content link for keyboard / screen reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
