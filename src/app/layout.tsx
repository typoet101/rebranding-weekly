import type { Metadata } from "next";
import { playfair, inter } from "@/styles/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rebranding Weekly",
    template: "%s | Rebranding Weekly",
  },
  description:
    "매주 월요일, 국내외 리브랜딩 뉴스를 AI가 큐레이션합니다. Every Monday, AI-curated rebranding news from Korea and around the world.",
  openGraph: {
    title: "Rebranding Weekly",
    description: "매주 월요일, 국내외 리브랜딩 뉴스를 AI가 큐레이션합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
