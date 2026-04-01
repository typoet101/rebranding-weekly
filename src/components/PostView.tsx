"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";
import SectionDivider from "./SectionDivider";
import AdminBar from "./AdminBar";

/** Sort: starred first, then by publishedAt desc */
function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return (b.publishedAt || "").localeCompare(a.publishedAt || "");
  });
}

function lsKey(type: "deleted" | "starred", weekDate: string) {
  return `rw_${type}_${weekDate}`;
}

export default function PostView({
  weekDate,
  initialArticles,
}: {
  weekDate: string;
  initialArticles: Article[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [isAdmin, setIsAdmin] = useState(false);

  // Apply persisted localStorage state on client mount
  useEffect(() => {
    try {
      const deletedRaw = localStorage.getItem(lsKey("deleted", weekDate));
      const starredRaw = localStorage.getItem(lsKey("starred", weekDate));

      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      const starredMap: Record<string, boolean> = starredRaw
        ? JSON.parse(starredRaw)
        : {};

      setArticles(
        initialArticles
          .filter((a) => !deletedIds.includes(a.id))
          .map((a) => ({
            ...a,
            starred:
              starredMap[a.id] !== undefined ? starredMap[a.id] : !!a.starred,
          }))
      );
    } catch {
      // localStorage unavailable — no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDelete(articleId: string) {
    if (!confirm("이 기사를 삭제하시겠습니까?")) return;

    try {
      const key = lsKey("deleted", weekDate);
      const existing: string[] = JSON.parse(
        localStorage.getItem(key) || "[]"
      );
      if (!existing.includes(articleId)) {
        localStorage.setItem(
          key,
          JSON.stringify([...existing, articleId])
        );
      }
    } catch {}

    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  function handleToggleStar(articleId: string, starred: boolean) {
    try {
      const key = lsKey("starred", weekDate);
      const existing: Record<string, boolean> = JSON.parse(
        localStorage.getItem(key) || "{}"
      );
      existing[articleId] = starred;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, starred } : a))
    );
  }

  const domestic = sortArticles(
    articles.filter((a) => a.category === "domestic")
  );
  const international = sortArticles(
    articles.filter((a) => a.category === "international")
  );

  return (
    <>
      {domestic.length > 0 && (
        <section>
          <SectionDivider title="국내 Domestic" count={domestic.length} />
          <div className="grid grid-cols-4 gap-3 mb-12">
            {domestic.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        </section>
      )}

      {international.length > 0 && (
        <section>
          <SectionDivider title="해외 International" count={international.length} />
          <div className="grid grid-cols-4 gap-3 mb-12">
            {international.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        </section>
      )}

      <AdminBar isAdmin={isAdmin} onToggle={setIsAdmin} />
    </>
  );
}
