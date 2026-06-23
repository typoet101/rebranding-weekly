"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import type { Industry } from "@/lib/industries";
import { INDUSTRIES } from "@/lib/industries";

export default function ArticleCard({
  article,
  isAdmin,
  onDelete,
  onToggleStar,
  onToggleHero,
  isHero,
  industry,
  onIndustryChange,
}: {
  article: Article;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onToggleStar?: (id: string, starred: boolean) => void;
  onToggleHero?: (id: string, hero: boolean) => void;
  isHero?: boolean;
  industry?: Industry;
  onIndustryChange?: (id: string, industry: Industry | undefined) => void;
}) {
  // Track runtime image-load failures (broken URLs, hotlink-protected, expired)
  // and gracefully degrade to the no-image layout (summary below title).
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage =
    !!article.imageUrl &&
    !article.imageUrl.includes("googleusercontent.com") &&
    !imageFailed;
  const isIntl = article.category === "international";
  const showThumb = hasImage && !isIntl;

  // Image fit: "contain" shows the whole image with white padding (~16px) for
  // articles whose thumbnail is a wide banner / logo that cover would crop.
  // Explicit override comes from admin via article.imageFit; we ALSO auto-detect
  // white-bg / transparent thumbnails below and switch to contain so logos don't
  // butt up against the card edge.
  const [autoContain, setAutoContain] = useState(false);

  useEffect(() => {
    if (!showThumb || article.imageFit === "contain") return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const w = canvas.width, h = canvas.height;
        const inset = Math.min(8, Math.floor(Math.min(w, h) * 0.02));
        const corners = [
          ctx.getImageData(inset, inset, 1, 1).data,
          ctx.getImageData(w - inset - 1, inset, 1, 1).data,
          ctx.getImageData(inset, h - inset - 1, 1, 1).data,
          ctx.getImageData(w - inset - 1, h - inset - 1, 1, 1).data,
        ];

        const isBlank = corners.every(([r, g, b, a]) =>
          a < 10 || (r > 240 && g > 240 && b > 240)
        );
        if (isBlank) setAutoContain(true);
      } catch {
        // CORS-tainted canvas — silently keep the default cover layout.
      }
    };
    img.src = article.imageUrl!;
  }, [article.imageUrl, article.imageFit, showThumb]);

  const fitContain = article.imageFit === "contain" || autoContain;
  // Logos / white-bg thumbnails: fill the card's full height (no vertical
  // padding so the image isn't visually cropped/shrunk), but keep 12px on the
  // sides so it doesn't butt against the card edge. object-contain still
  // prevents any actual cropping for ultra-wide logos.
  const imgClass = fitContain
    ? "w-full h-full object-contain px-3 bg-white"
    : "w-full h-full object-cover";
  const imgHoverClass = fitContain
    ? imgClass
    : `${imgClass} group-hover:scale-105 transition-transform duration-500`;

  const categoryLabel = article.category === "domestic" ? "KR" : "EN";

  return (
    <article className={`group relative border rounded-sm overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border-border`}>
      {/* Top accent bar above the thumbnail */}
      <div className="h-[4px] bg-primary" />

      {/* Admin buttons */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {onToggleHero && hasImage && (
            <button
              onClick={() => onToggleHero(article.id, !isHero)}
              className={`rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-md transition-colors no-underline hover:no-underline ${
                isHero
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-400 hover:text-blue-500"
              }`}
              title={isHero ? "메인 이미지 해제" : "메인 이미지로 지정"}
            >
              🖼
            </button>
          )}
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

      {/* Hero indicator (admin only) */}
      {isHero && isAdmin && (
        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm">
          🖼 메인 이미지
        </div>
      )}

      {/* === Mobile === */}
      <div className="sm:hidden">
        {showThumb && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-[4/3] overflow-hidden bg-surface no-underline">
            <img
              src={article.imageUrl}
              alt=""
              className={imgClass}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </a>
        )}
        <div className="p-2">
          <h3 className="text-[0.7rem] font-sans font-bold leading-snug line-clamp-3">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline text-primary">
              {article.title}
            </a>
          </h3>
          {!showThumb && article.summary && (
            <p className="mt-1.5 text-[0.65rem] text-secondary leading-relaxed line-clamp-4">
              {article.summary}
            </p>
          )}
        </div>
      </div>

      {/* === Desktop === */}
      <div className="hidden sm:block">
        {/* Thumbnail — only for domestic with image */}
        {showThumb && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-[4/3] overflow-hidden bg-surface no-underline">
            <img
              src={article.imageUrl}
              alt=""
              className={imgHoverClass}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
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

          <h3 className="text-[0.95rem] font-sans font-bold leading-snug line-clamp-2 mb-1.5">
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
