import type { Article } from "@/lib/types";
import SourceBadge from "./SourceBadge";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group py-6 border-b border-border last:border-b-0">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SourceBadge source={article.source} />
            <time className="text-caption text-muted font-mono">
              {article.publishedAt}
            </time>
          </div>

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

          <p className="text-body text-secondary leading-relaxed">
            {article.summary}
          </p>

          <div className="mt-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small text-muted hover:text-primary no-underline hover:no-underline transition-colors"
            >
              Read original &rarr;
            </a>
          </div>
        </div>

        {/* Thumbnail */}
        {article.imageUrl && (
          <div className="sm:w-48 sm:h-32 w-full h-40 flex-shrink-0 overflow-hidden rounded bg-surface">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </article>
  );
}
