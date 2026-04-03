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
  const isIntl = article.category === "international";
  const showThumb = hasImage && !isIntl;

  const categoryLabel = article.category === "domestic" ? "KR" : "EN";

  return (
    <article className={`group relative border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow duration-300 ${article.starred ? "border-border" : "border-border"}`}>
      {/* Admin buttons */}
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

      {/* BRIK's Pick badge */}
      {article.starred && !isAdmin && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-black rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm">
          BRIK&apos;s Pick
        </div>
      )}

      {/* === Mobile === */}
      <div className="sm:hidden">
        {showThumb && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-[4/3] overflow-hidden bg-surface no-underline">
            <img src={article.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          </a>
        )}
        <div className="p-2">
          <h3 className="text-[0.7rem] font-serif font-bold leading-snug line-clamp-3">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline text-primary">
              {article.title}
            </a>
          </h3>
        </div>
      </div>

      {/* === Desktop === */}
      <div className="hidden sm:block">
        {/* Thumbnail — only for domestic with image */}
        {showThumb && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-[4/3] overflow-hidden bg-surface no-underline">
            <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          </a>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted font-mono">{article.publishedAt}</span>
            <div className="flex items-center gap-1.5">
              {industry && (
                <span className="text-[10px] font-sans font-medium text-white bg-gray-700 rounded-full px-2 py-px">
                  {industry}
                </span>
              )}
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-primary border border-primary rounded-full px-2 py-px no-underline">
                {categoryLabel}
              </span>
            </div>
          </div>

          <h3 className="text-[0.95rem] font-serif font-bold leading-snug line-clamp-2 mb-1.5">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline text-primary">
              {article.title}
            </a>
          </h3>

          <p className="text-[0.8rem] text-secondary leading-relaxed line-clamp-2 mb-2">
            {article.summary}
          </p>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">{article.source}</span>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary no-underline hover:no-underline uppercase tracking-wider">
              원문 보기
            </a>
          </div>
        </div>
      </div>

      {/* Admin: Industry selector */}
      {isAdmin && onIndustryChange && (
        <div className="px-4 pb-3 hidden sm:block">
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
