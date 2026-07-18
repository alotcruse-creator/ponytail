import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Freshness } from "@/components/Freshness";

const serif = Fraunces({
  subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"],
  variable: "--font-serif", display: "swap",
});
const sans = Inter({
  subsets: ["latin"], variable: "--font-sans", display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-mono", display: "swap",
});

export const metadata: Metadata = {
  title: "FX Treasury Copilot",
  description: "Morning FX market intelligence — read-only, PHP-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <Freshness />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
