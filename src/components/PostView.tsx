"use client";

import { useState } from "react";
import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";
import SectionDivider from "./SectionDivider";
import AdminBar from "./AdminBar";

export default function PostView({
  weekDate,
  initialArticles,
}: {
  weekDate: string;
  initialArticles: Article[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const domestic = articles.filter((a) => a.category === "domestic");
  const international = articles.filter((a) => a.category === "international");

  async function handleDelete(articleId: string) {
    if (!confirm("이 기사를 삭제하시겠습니까?")) return;

    const pw = sessionStorage.getItem("admin_pw") || "";
    setDeleting(articleId);

    try {
      const res = await fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: weekDate, articleId, password: pw }),
      });

      const data = await res.json();

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        alert(data.error || "삭제 실패");
        if (res.status === 401) {
          setIsAdmin(false);
          sessionStorage.removeItem("admin_pw");
        }
      }
    } catch {
      alert("네트워크 오류");
    } finally {
      setDeleting(null);
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
              />
            ))}
          </div>
        </section>
      )}

      <AdminBar isAdmin={isAdmin} onToggle={setIsAdmin} />
    </>
  );
}
