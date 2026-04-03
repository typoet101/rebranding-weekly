"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Article } from "@/lib/types";
import type { Industry } from "@/lib/industries";
import SortableCard from "./SortableCard";
import ArticleCard from "./ArticleCard";
import SectionDivider from "./SectionDivider";
import AdminBar from "./AdminBar";
import BrikCTA from "./BrikCTA";

function lsKey(type: "deleted" | "starred" | "order" | "industry", weekDate: string, category?: string) {
  return category ? `rw_${type}_${weekDate}_${category}` : `rw_${type}_${weekDate}`;
}

export default function PostView({
  weekDate,
  initialArticles,
}: {
  weekDate: string;
  initialArticles: Article[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [isAdmin, setIsAdmin] = useState(false);
  const [industryMap, setIndustryMap] = useState<Record<string, Industry>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Apply persisted localStorage state on client mount
  useEffect(() => {
    try {
      const deletedRaw = localStorage.getItem(lsKey("deleted", weekDate));
      const starredRaw = localStorage.getItem(lsKey("starred", weekDate));
      const industryRaw = localStorage.getItem(lsKey("industry", weekDate));

      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      const starredMap: Record<string, boolean> = starredRaw
        ? JSON.parse(starredRaw)
        : {};

      if (industryRaw) {
        setIndustryMap(JSON.parse(industryRaw));
      }

      let filtered = initialArticles
        .filter((a) => !deletedIds.includes(a.id))
        .map((a) => ({
          ...a,
          starred:
            starredMap[a.id] !== undefined ? starredMap[a.id] : !!a.starred,
        }));

      // Apply saved order for each category
      for (const cat of ["domestic", "international"] as const) {
        const orderRaw = localStorage.getItem(lsKey("order", weekDate, cat));
        if (orderRaw) {
          const savedOrder: string[] = JSON.parse(orderRaw);
          const catArticles = filtered.filter((a) => a.category === cat);
          const otherArticles = filtered.filter((a) => a.category !== cat);

          // Sort by saved order
          catArticles.sort((a, b) => {
            const ai = savedOrder.indexOf(a.id);
            const bi = savedOrder.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });

          filtered = [...catArticles, ...otherArticles];
        }
      }

      setArticles(filtered);
    } catch {
      // localStorage unavailable — no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDelete(articleId: string) {
    if (!confirm("이 기사를 삭제하시겠습니까?")) return;

    try {
      const key = lsKey("deleted", weekDate);
      const existing: string[] = JSON.parse(
        localStorage.getItem(key) || "[]"
      );
      if (!existing.includes(articleId)) {
        localStorage.setItem(key, JSON.stringify([...existing, articleId]));
      }
    } catch {}

    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  function handleToggleStar(articleId: string, starred: boolean) {
    try {
      const key = lsKey("starred", weekDate);
      const existing: Record<string, boolean> = JSON.parse(
        localStorage.getItem(key) || "{}"
      );
      existing[articleId] = starred;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, starred } : a))
    );
  }

  function handleIndustryChange(articleId: string, industry: Industry | undefined) {
    setIndustryMap((prev) => {
      const next = { ...prev };
      if (industry) {
        next[articleId] = industry;
      } else {
        delete next[articleId];
      }
      try {
        localStorage.setItem(lsKey("industry", weekDate), JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent, category: "domestic" | "international") {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setArticles((prev) => {
      const catArticles = prev.filter((a) => a.category === category);
      const otherArticles = prev.filter((a) => a.category !== category);

      const oldIndex = catArticles.findIndex((a) => a.id === active.id);
      const newIndex = catArticles.findIndex((a) => a.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(catArticles, oldIndex, newIndex);

      // Save order to localStorage
      try {
        localStorage.setItem(
          lsKey("order", weekDate, category),
          JSON.stringify(reordered.map((a) => a.id))
        );
      } catch {}

      return category === "domestic"
        ? [...reordered, ...otherArticles]
        : [...otherArticles, ...reordered];
    });
  }

  const domestic = articles.filter((a) => a.category === "domestic");
  const international = articles.filter((a) => a.category === "international");

  return (
    <>
      {domestic.length > 0 && (
        <section>
          <SectionDivider title="국내 Domestic" count={domestic.length} />
          {isAdmin ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, "domestic")}
            >
              <SortableContext
                items={domestic.map((a) => a.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 gap-3 mb-12">
                  {domestic.map((article) => (
                    <SortableCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                      onIndustryChange={handleIndustryChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-4 gap-3 mb-12">
              {domestic.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* BRIK CTA — between domestic and international */}
      <BrikCTA />

      {international.length > 0 && (
        <section>
          <SectionDivider title="해외 International" count={international.length} />
          {isAdmin ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, "international")}
            >
              <SortableContext
                items={international.map((a) => a.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 gap-3 mb-12">
                  {international.map((article) => (
                    <SortableCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                      onIndustryChange={handleIndustryChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-4 gap-3 mb-12">
              {international.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <AdminBar isAdmin={isAdmin} onToggle={setIsAdmin} />
    </>
  );
}
