import { getAllPostDates, getPost } from "@/lib/content";
import type { Article } from "@/lib/types";
import SearchClient from "./SearchClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Rebranding Weekly의 모든 기사를 검색합니다.",
};

interface IndexedArticle extends Article {
  weekDate: string;
}

export default function SearchPage() {
  // Build a flat index of every article across every week, server-side.
  const dates = getAllPostDates();
  const articles: IndexedArticle[] = [];

  for (const date of dates) {
    const post = getPost(date);
    if (!post) continue;
    for (const a of post.articles) {
      articles.push({ ...a, weekDate: post.weekDate });
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 md:py-16">
      <h1 className="text-display font-serif font-bold text-center mb-3">
        Search
      </h1>
      <p className="text-body text-secondary text-center mb-10">
        제목, 출처, 요약 어디든 검색됩니다.
      </p>
      <SearchClient articles={articles} />
    </div>
  );
}
