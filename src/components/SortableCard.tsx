"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Article } from "@/lib/types";
import type { Industry } from "@/lib/industries";
import ArticleCard from "./ArticleCard";

export default function SortableCard({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Drag handle — only in admin mode */}
      {isAdmin && (
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing bg-gray-100 text-center text-[10px] text-gray-400 py-1 select-none hover:bg-gray-200 transition-colors rounded-t-sm"
        >
          ⠿ 드래그하여 이동
        </div>
      )}
      <ArticleCard
        article={article}
        isAdmin={isAdmin}
        onDelete={onDelete}
        onToggleStar={onToggleStar}
        industry={industry}
        onIndustryChange={onIndustryChange}
      />
    </div>
  );
}
