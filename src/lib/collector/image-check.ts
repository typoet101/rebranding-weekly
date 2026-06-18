/**
 * Image URL health check + recovery helpers.
 *
 * Source sites occasionally replace, re-upload, or delete article images,
 * which leaves us with cached imageUrl values that 404. This module provides
 * two primitives:
 *
 *   verifyImage(url)      → HEAD check, returns true if 200 + image/* type
 *   refetchOgImage(url)   → re-extract og:image from the article page
 *
 * Used at two points:
 *   - Collector (scrape time): drop imageUrl if it doesn't pass verifyImage
 *   - Weekly heal-images job:  detect broken images, try to refetch, else clear
 */
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEAD_TIMEOUT_MS = 8000;
const GET_TIMEOUT_MS = 12000;

/**
 * Verify an image URL is reachable and actually serves an image.
 * Some servers refuse HEAD — we fall back to a ranged GET (first byte only).
 */
export async function verifyImage(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;

  // Strategy 1: HEAD — only trust a CLEAR success. Many CDNs respond 404
  // or 4xx to HEAD even when GET works fine, so we always fall through to
  // a ranged GET unless HEAD definitively confirms an image.
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) return true;
      // Empty / octet-stream: ambiguous — verify via GET
    }
    // Any non-conclusive HEAD response → fall through to GET
  } catch {
    // network error / timeout / no HEAD support — try GET
  }

  // Strategy 2: tiny ranged GET (authoritative)
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA, Range: "bytes=0-127" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Re-extract og:image (or twitter:image / first body image) from an article
 * page. Returns the freshest URL the source is currently advertising, or null.
 */
export async function refetchOgImage(articleUrl: string): Promise<string | null> {
  if (!articleUrl || !articleUrl.startsWith("http")) return null;
  // Skip Google News intermediate URLs — they don't render to a real page
  if (articleUrl.includes("news.google.com/rss/")) return null;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $("article img[src]").first().attr("src"),
      $('[role="main"] img[src]').first().attr("src"),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const abs = candidate.startsWith("http")
        ? candidate
        : new URL(candidate, articleUrl).href;
      if (abs.toLowerCase().includes("googleusercontent.com")) continue;
      if (await verifyImage(abs)) return abs;
    }
    return null;
  } catch {
    return null;
  }
}
