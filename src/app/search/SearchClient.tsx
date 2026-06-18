"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/lib/types";

interface IndexedArticle extends Article {
  weekDate: string;
}

const PAGE_SIZE = 24;

export default function SearchClient({
  articles,
}: {
  articles: IndexedArticle[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "domestic" | "international">(
    "all"
  );
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (filter !== "all" && a.category !== filter) return false;
      if (!q) return false;
      return (
        a.title.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        (a.summary || "").toLowerCase().includes(q) ||
        (a.industry || "").toLowerCase().includes(q)
      );
    });
  }, [articles, query, filter]);

  return (
    <div className="max-w-content mx-auto">
      {/* Search input */}
      <div className="relative mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="검색어를 입력하세요 (예: 스타벅스, 로고, 패키지)"
          className="w-full text-base px-5 py-4 border border-border rounded-sm bg-white focus:outline-none focus:border-primary transition-colors"
          autoFocus
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-8">
        {(["all", "domestic", "international"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full no-underline transition-colors ${
              filter === opt
                ? "bg-primary text-white"
                : "bg-transparent text-secondary border border-border hover:border-primary"
            }`}
          >
            {opt === "all" ? "전체" : opt === "domestic" ? "국내 KR" : "해외 EN"}
          </button>
        ))}
        {query.trim() && (
          <span className="ml-auto text-[12px] text-muted">
            {results.length.toLocaleString()}개 결과
          </span>
        )}
      </div>

      {/* Results */}
      {!query.trim() ? (
        <p className="text-center text-muted py-16 text-small">
          검색어를 입력해주세요.
        </p>
      ) : results.length === 0 ? (
        <p className="text-center text-muted py-16 text-small">
          “{query}” 결과가 없습니다.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {results.slice(0, visible).map((a) => (
              <li
                key={`${a.weekDate}-${a.id}`}
                className="border border-border rounded-sm bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline hover:no-underline"
                >
                  <div className="flex items-center justify-between mb-1.5 text-[11px] text-muted">
                    <span>
                      {a.publishedAt} · {a.source}
                    </span>
                    <span className="font-mono">
                      {a.category === "domestic" ? "KR" : "EN"} ·{" "}
                      {a.weekDate}
                    </span>
                  </div>
                  <h3 className="text-[1rem] font-sans font-bold text-primary leading-snug mb-1">
                    <Highlight text={a.title} query={query} />
                  </h3>
                  {a.summary && (
                    <p className="text-[0.85rem] text-secondary leading-relaxed line-clamp-2">
                      <Highlight text={a.summary} query={query} />
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {visible < results.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="text-[12px] uppercase tracking-widest px-5 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors no-underline"
              >
                더 보기 ({results.length - visible}개 남음)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Bold the matched substring(s) in result text. Case-insensitive. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-primary px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
