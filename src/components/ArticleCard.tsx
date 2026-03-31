import type { Article } from "@/lib/types";

export default function ArticleCard({ article }: { article: Article }) {
  const hasImage =
    article.imageUrl && !article.imageUrl.includes("googleusercontent.com");

  return (
    <article className="group border border-border rounded-sm overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-3xl font-serif font-bold text-gray-300 px-4 text-center leading-tight">
              {article.title.slice(0, 30)}
            </span>
          </div>
        )}
      </a>

      {/* Content */}
      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <time className="text-caption text-muted font-mono">
            {article.publishedAt}
          </time>
          <span className="text-caption font-sans font-medium uppercase tracking-wider text-primary border border-primary rounded-full px-2.5 py-0.5 no-underline">
            {article.category === "domestic" ? "KR" : "Global"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[1.05rem] font-serif font-bold mb-2 leading-snug line-clamp-2">
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
        <p className="text-small text-secondary leading-relaxed line-clamp-3 mb-3">
          {article.summary}
        </p>

        {/* Source + Read more */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-caption text-muted font-sans">
            {article.source}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption font-semibold text-primary no-underline hover:no-underline uppercase tracking-wider"
          >
            Read more
          </a>
        </div>
      </div>
    </article>
  );
}
