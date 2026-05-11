/**
 * Vercel KV (Upstash Redis) helpers for per-week admin overrides.
 *
 * The JSON files under content/posts remain the source of truth for article
 * content. This KV layer overlays admin metadata that admins should be able
 * to change instantly from any device:
 *
 *   - heroArticleId  : which article's image is the homepage hero
 *   - starredIds[]   : article IDs marked as BRIK's Pick
 *   - deletedIds[]   : article IDs hidden from public view
 *
 * All read/write paths are isolated here. If KV is unreachable (local dev
 * without env vars, network blip, etc.) functions return safe defaults so
 * the site keeps rendering with the JSON-only state.
 */
import { kv } from "@vercel/kv";

export interface PostOverrides {
  heroArticleId?: string;
  starredIds: string[];
  deletedIds: string[];
}

const EMPTY_OVERRIDES: PostOverrides = {
  heroArticleId: undefined,
  starredIds: [],
  deletedIds: [],
};

function key(weekDate: string): string {
  return `rw:overrides:${weekDate}`;
}

/** True when KV credentials are configured in this environment. */
export function isKvAvailable(): boolean {
  return (
    !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
  );
}

/** Read overrides for one week. Returns empty defaults on miss or error. */
export async function getOverrides(weekDate: string): Promise<PostOverrides> {
  if (!isKvAvailable()) return EMPTY_OVERRIDES;
  try {
    const raw = await kv.get<PostOverrides>(key(weekDate));
    if (!raw) return EMPTY_OVERRIDES;
    // Defensive normalization
    return {
      heroArticleId: raw.heroArticleId,
      starredIds: Array.isArray(raw.starredIds) ? raw.starredIds : [],
      deletedIds: Array.isArray(raw.deletedIds) ? raw.deletedIds : [],
    };
  } catch (err) {
    console.warn("[KV] get failed:", (err as Error).message);
    return EMPTY_OVERRIDES;
  }
}

/** Atomic-ish update: read, mutate, write. */
export async function updateOverrides(
  weekDate: string,
  patch: (current: PostOverrides) => PostOverrides
): Promise<PostOverrides> {
  if (!isKvAvailable()) {
    throw new Error(
      "KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN)"
    );
  }
  const current = await getOverrides(weekDate);
  const next = patch(current);
  await kv.set(key(weekDate), next);
  return next;
}

/** Toggle starred state for one article. */
export async function setStarred(
  weekDate: string,
  articleId: string,
  starred: boolean
): Promise<PostOverrides> {
  return updateOverrides(weekDate, (cur) => {
    const set = new Set(cur.starredIds);
    if (starred) set.add(articleId);
    else set.delete(articleId);
    return { ...cur, starredIds: [...set] };
  });
}

/** Set or clear the hero article for one week. */
export async function setHero(
  weekDate: string,
  articleId: string,
  hero: boolean
): Promise<PostOverrides> {
  return updateOverrides(weekDate, (cur) => ({
    ...cur,
    heroArticleId: hero ? articleId : undefined,
  }));
}

/** Mark an article as deleted (hidden from public view). */
export async function addDeleted(
  weekDate: string,
  articleId: string
): Promise<PostOverrides> {
  return updateOverrides(weekDate, (cur) => {
    const set = new Set(cur.deletedIds);
    set.add(articleId);
    return { ...cur, deletedIds: [...set] };
  });
}
