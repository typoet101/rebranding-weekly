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
import Toast, { type ToastTone } from "./Toast";

function lsKey(type: "deleted" | "starred" | "order" | "industry", weekDate: string, category?: string) {
  return category ? `rw_${type}_${weekDate}_${category}` : `rw_${type}_${weekDate}`;
}

export default function PostView({
  weekDate,
  initialArticles,
  initialHeroId,
}: {
  weekDate: string;
  initialArticles: Article[];
  initialHeroId?: string;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [isAdmin, setIsAdmin] = useState(false);
  const [heroId, setHeroId] = useState<string | undefined>(initialHeroId);
  const [industryMap, setIndustryMap] = useState<Record<string, Industry>>({});
  const [toast, setToast] = useState<{ msg: string; tone: ToastTone; key: number } | null>(null);
  const [editStats, setEditStats] = useState({ stars: 0, hero: 0, deletes: 0 });
  const [readOnly, setReadOnly] = useState(false);

  function showToast(msg: string, tone: ToastTone = "success") {
    setToast({ msg, tone, key: Date.now() });
  }
  /**
   * Real saves go through Vercel KV now, so all environments can persist.
   * The readOnly flag only flips if the API itself errors out (e.g. KV not
   * configured), which we expose so the user knows to run setup.
   */
  function isReadOnly(): boolean {
    return readOnly;
  }
  function bumpStat(k: keyof typeof editStats) {
    setEditStats((s) => ({ ...s, [k]: s[k] + 1 }));
  }
  function handleAdminToggle(next: boolean) {
    if (next && isReadOnly()) {
      showToast("👁 프리뷰 모드 — 영구 저장은 CLI 사용 (npm run hero/star)", "info");
    }
    if (!next) {
      const { stars, hero, deletes } = editStats;
      const total = stars + hero + deletes;
      if (total > 0) {
        const parts: string[] = [];
        if (hero > 0) parts.push(`메인 이미지 ${hero}회`);
        if (stars > 0) parts.push(`BRIK's Pick ${stars}회`);
        if (deletes > 0) parts.push(`삭제 ${deletes}건`);
        const verb = isReadOnly() ? "프리뷰 적용" : "적용 완료";
        showToast(`✓ ${verb} — ${parts.join(", ")}`);
      }
      setEditStats({ stars: 0, hero: 0, deletes: 0 });
    }
    setIsAdmin(next);
  }

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
    bumpStat("deletes");
    showToast("✓ 기사 삭제됨");
  }

  async function handleToggleStar(articleId: string, starred: boolean) {
    // Optimistic UI update
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, starred } : a))
    );

    // Local cache (for non-admin viewers who toggle in their own browser)
    try {
      const key = lsKey("starred", weekDate);
      const existing: Record<string, boolean> = JSON.parse(
        localStorage.getItem(key) || "{}"
      );
      existing[articleId] = starred;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    // Persist to JSON via admin API (only meaningful in admin mode)
    let password = "";
    try {
      password = sessionStorage.getItem("rw_admin_pw") || "";
    } catch {}
    if (!isAdmin || !password) return;

    // Read-only deployments: skip API call, treat as preview
    if (isReadOnly()) {
      showToast(starred ? "👁 프리뷰: BRIK's Pick" : "👁 프리뷰: 해제", "info");
      bumpStat("stars");
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: weekDate, articleId, password, starred }),
      });
      if (res.ok) {
        showToast(starred ? "✓ BRIK's Pick 저장됨" : "✓ BRIK's Pick 해제됨");
        bumpStat("stars");
      } else if (res.status === 503) {
        // KV not configured on this deployment
        setReadOnly(true);
        showToast("KV 미설정 — 관리자에게 문의", "error");
        bumpStat("stars");
      } else {
        const { error } = await res.json().catch(() => ({ error: "" }));
        console.warn("[Star] Server rejected:", error || res.status);
        showToast(`저장 실패 (${res.status}) — 인증 확인`, "error");
      }
    } catch (err) {
      console.warn("[Star] Network error:", (err as Error).message);
      setReadOnly(true);
      showToast("👁 프리뷰 모드 — 네트워크 오류", "info");
      bumpStat("stars");
    }
  }

  async function handleToggleHero(articleId: string, hero: boolean) {
    // Exclusive selection: setting hero=true clears any other hero state in the UI
    setHeroId(hero ? articleId : undefined);

    let password = "";
    try {
      password = sessionStorage.getItem("rw_admin_pw") || "";
    } catch {}
    if (!isAdmin || !password) return;

    // Read-only deployments: skip API call, treat as preview
    if (isReadOnly()) {
      showToast(hero ? "👁 프리뷰: 메인 이미지" : "👁 프리뷰: 해제", "info");
      bumpStat("hero");
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: weekDate, articleId, password, hero }),
      });
      if (res.ok) {
        showToast(hero ? "✓ 메인 이미지로 지정됨" : "✓ 메인 이미지 해제됨");
        bumpStat("hero");
      } else if (res.status >= 500) {
        setReadOnly(true);
        showToast("👁 프리뷰 모드 — 영구 저장은 CLI 사용", "info");
        bumpStat("hero");
      } else {
        const { error } = await res.json().catch(() => ({ error: "" }));
        console.warn("[Hero] Server rejected:", error || res.status);
        showToast(`저장 실패 (${res.status}) — 인증 확인`, "error");
      }
    } catch (err) {
      console.warn("[Hero] Network error:", (err as Error).message);
      setReadOnly(true);
      showToast("👁 프리뷰 모드 — 네트워크 오류", "info");
      bumpStat("hero");
    }
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

  // BRIK's Pick (starred) articles bubble to the top of their section
  function starsFirst<T extends { starred?: boolean }>(arr: T[]): T[] {
    const stars = arr.filter((a) => a.starred);
    const rest = arr.filter((a) => !a.starred);
    return [...stars, ...rest];
  }
  const domestic = starsFirst(articles.filter((a) => a.category === "domestic"));
  const international = starsFirst(articles.filter((a) => a.category === "international"));

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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5 mb-12">
                  {domestic.map((article) => (
                    <SortableCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      onToggleHero={handleToggleHero}
                      isHero={article.id === heroId}
                      industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                      onIndustryChange={handleIndustryChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5 mb-12">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5 mb-12">
                  {international.map((article) => (
                    <SortableCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      onToggleHero={handleToggleHero}
                      isHero={article.id === heroId}
                      industry={industryMap[article.id] || (article.industry as Industry | undefined)}
                      onIndustryChange={handleIndustryChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5 mb-12">
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

      <AdminBar
        isAdmin={isAdmin}
        onToggle={handleAdminToggle}
        pendingCount={editStats.stars + editStats.hero + editStats.deletes}
      />

      {toast && (
        <Toast
          key={toast.key}
          message={toast.msg}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
