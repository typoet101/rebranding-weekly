import type { Article } from "@/lib/types";
import type { Industry } from "@/lib/industries";
import { INDUSTRIES } from "@/lib/industries";

export default function ArticleCard({
  article,
  isAdmin,
  onDelete,
  onToggleStar,
  industry,
  onIndustryChange,
}: {
  article: Article;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onToggleStar?: (id: string, starred: boolean) => void;
  industry?: Industry;
  onIndustryChange?: (id: string, industry: Industry | undefined) => void;
}) {
  const hasImage =
    article.imageUrl && !article.imageUrl.includes("googleusercontent.com");
  const isDomestic = article.category === "domestic";
  const categoryLabel = isDomestic ? "Domestic" : "Global";
  const industryLabel = industry || article.industry || "기타";

  return (
    <article className="group relative bg-white border border-border rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
      {/* Thin top accent bar */}
      <div className="h-[3px] bg-primary" />

      {/* Admin overlays */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {onToggleStar && (
            <button
              onClick={() => onToggleStar(article.id, !article.starred)}
              className={`rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-md transition-colors no-underline hover:no-underline ${
                article.starred
                  ? "bg-yellow-400 text-white"
                  : "bg-white text-gray-400 hover:text-yellow-400"
              }`}
              title={article.starred ? "별표 해제" : "별표"}
            >
              ★
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(article.id)}
              className="bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-700 transition-colors no-underline hover:no-underline"
              title="삭제"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* BRIK's Pick (public) */}
      {article.starred && !isAdmin && (
        <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-black rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm">
          BRIK&apos;s Pick
        </div>
      )}

      {/* Header: industry (left) + category badge (right) */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-start justify-between gap-3">
        <span className="text-[11px] sm:text-[12px] text-secondary font-medium leading-tight truncate">
          {industryLabel}
        </span>
        <span
          className={`text-[11px] sm:text-[12px] font-bold leading-tight uppercase tracking-wide shrink-0 ${
            isDomestic ? "text-[#E04B2A]" : "text-[#1B5DBE]"
          }`}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="px-3 sm:px-4 pb-3 sm:pb-4 text-[0.85rem] sm:text-[1.05rem] font-sans font-bold leading-snug text-primary line-clamp-3">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline hover:no-underline text-primary"
        >
          {article.title}
        </a>
      </h3>

      {/* Image */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[16/10] bg-surface overflow-hidden no-underline"
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f5f3ed] to-[#e8e3d4]">
            <span className="text-primary/70 font-serif font-bold text-base sm:text-lg text-center px-4 line-clamp-3">
              {article.title}
            </span>
          </div>
        )}
      </a>

      {/* Footer: date (left) + source uppercase (right) */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] mt-auto">
        <span className="text-muted font-mono truncate">{article.publishedAt}</span>
        <span className="text-muted uppercase tracking-wider font-medium truncate">
          {article.source}
        </span>
      </div>

      {/* Admin: industry selector */}
      {isAdmin && onIndustryChange && (
        <div className="px-3 sm:px-4 pb-3 hidden sm:block">
          <select
            value={industry || ""}
            onChange={(e) =>
              onIndustryChange(
                article.id,
                e.target.value ? (e.target.value as Industry) : undefined
              )
            }
            className="w-full text-[11px] border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-gray-500"
          >
            <option value="">산업 카테고리 선택</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      )}
    </article>
  );
}
