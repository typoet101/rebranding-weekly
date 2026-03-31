"use client";

import { useState } from "react";
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

export default function PostView({
  weekDate,
  initialArticles,
}: {
  weekDate: string;
  initialArticles: Article[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [isAdmin, setIsAdmin] = useState(false);

  const domestic = sortArticles(articles.filter((a) => a.category === "domestic"));
  const international = sortArticles(articles.filter((a) => a.category === "international"));

  function getPw() {
    return sessionStorage.getItem("admin_pw") || "";
  }

  async function handleDelete(articleId: string) {
    if (!confirm("이 기사를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: weekDate, articleId, password: getPw() }),
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
        if (res.status === 401) {
          setIsAdmin(false);
          sessionStorage.removeItem("admin_pw");
        }
      }
    } catch {
      alert("네트워크 오류");
    }
  }

  async function handleToggleStar(articleId: string, starred: boolean) {
    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: weekDate, articleId, password: getPw(), starred }),
      });

      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, starred } : a))
        );
      } else {
        const data = await res.json();
        alert(data.error || "별표 실패");
        if (res.status === 401) {
          setIsAdmin(false);
          sessionStorage.removeItem("admin_pw");
        }
      }
    } catch {
      alert("네트워크 오류");
    }
  }

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
