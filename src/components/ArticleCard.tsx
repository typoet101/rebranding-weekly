import type { Article } from "@/lib/types";

export default function ArticleCard({
  article,
  isAdmin,
  onDelete,
}: {
  article: Article;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const hasImage =
    article.imageUrl && !article.imageUrl.includes("googleusercontent.com");

  return (
    <article className="group relative border border-border rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow duration-300">
      {/* Admin: Delete button */}
      {isAdmin && onDelete && (
        <button
          onClick={() => onDelete(article.id)}
          className="absolute top-2 right-2 z-10 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-700 transition-colors no-underline hover:no-underline"
          title="삭제"
        >
          ✕
        </button>
      )}

      {/* Thumbnail 4:3 */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full aspect-[4/3] overflow-hidden bg-surface no-underline"
      >
        {hasImage ? (
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
            <span className="text-xl font-serif font-bold text-gray-300 px-4 text-center leading-tight">
              {article.title.slice(0, 24)}
            </span>
          </div>
        )}
      </a>

      {/* Content — compact */}
      <div className="p-4">
        {/* Meta */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted font-mono">{article.publishedAt}</span>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-primary border border-primary rounded-full px-2 py-px no-underline">
            {article.category === "domestic" ? "KR" : "EN"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[0.95rem] font-serif font-bold leading-snug line-clamp-2 mb-1.5">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:no-underline text-primary"
          >
            {article.title}
          </a>
        </h3>

        {/* Summary */}
        <p className="text-[0.8rem] text-secondary leading-relaxed line-clamp-2 mb-2">
          {article.summary}
        </p>

        {/* Source + Read more */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">{article.source}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary no-underline hover:no-underline uppercase tracking-wider"
          >
            Read more
          </a>
        </div>
      </div>
    </article>
  );
}
