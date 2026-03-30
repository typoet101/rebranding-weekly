import type { Article } from "@/lib/types";
import SourceBadge from "./SourceBadge";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group py-5 border-b border-border last:border-b-0">
      {/* Thumbnail — full width on top (hide if no valid image) */}
      {article.imageUrl && !article.imageUrl.includes("googleusercontent.com") && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-48 mb-4 overflow-hidden rounded bg-surface no-underline"
        >
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            loading="lazy"
          />
        </a>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 mb-2">
        <SourceBadge source={article.source} />
        <time className="text-caption text-muted font-mono">
          {article.publishedAt}
        </time>
      </div>

      {/* Title */}
      <h3 className="text-h3 font-serif font-semibold mb-2 leading-snug">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline hover:underline hover:decoration-primary"
        >
          {article.title}
        </a>
      </h3>

      {/* Summary */}
      <p className="text-small text-secondary leading-relaxed">
        {article.summary}
      </p>

      <div className="mt-2">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-muted hover:text-primary no-underline hover:no-underline transition-colors"
        >
          원문 보기 &rarr;
        </a>
      </div>
    </article>
  );
}
