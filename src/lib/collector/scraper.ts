import * as cheerio from "cheerio";
import { USER_AGENT, MAX_ARTICLE_TEXT, SCRAPE_TIMEOUT_MS } from "./sources";

interface ScrapeResult {
  text: string;
  imageUrl?: string;
}

/**
 * Blocklist: reject OG images that are generic logos, not article-specific.
 */
const IMAGE_BLOCKLIST = [
  "news.google.com",
  "lh3.googleusercontent.com",
  "googleusercontent.com/J6_",
  "google.com/images",
  "default_og",
  "favicon",
  "placeholder",
  "noimage",
  "no-image",
  "no_image",
  "blank.gif",
  "transparent.png",
  "default.jpg",
  "default.png",
  "og_default",
  "img_default",
  "thumb_default",
];

function isValidImageUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Block known generic images
  if (IMAGE_BLOCKLIST.some((b) => lower.includes(b))) return false;
  // Must be a real image URL
  if (!lower.startsWith("http")) return false;
  // Minimum length (reject tiny placeholder URLs)
  if (url.length < 20) return false;
  return true;
}

/**
 * Resolve Google News redirect URL to the actual article URL.
 * Google News uses JS-based redirects, so we parse the HTML to find the real URL.
 */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!url.includes("news.google.com") && !url.includes("google.com/rss")) {
    return url;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // If redirected away from Google, we have the real URL
    if (res.url && !res.url.includes("google.com")) {
      return res.url;
    }

    // Otherwise parse HTML for the redirect target
    const html = await res.text();

    // Method 1: Look for data-redirect attribute or JS redirect
    const patterns = [
      /data-redirect="([^"]+)"/,
      /window\.location\.replace\("([^"]+)"\)/,
      /window\.location\s*=\s*"([^"]+)"/,
      /href="(https?:\/\/(?!news\.google)[^"]+)"/,
      /<a[^>]+href="(https?:\/\/(?!news\.google|accounts\.google)[^"]+)"[^>]*>/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1] && !match[1].includes("google.com")) {
        return match[1];
      }
    }

    return res.url || url;
  } catch {
    return url;
  }
}

/**
 * Scrape an article page to extract body text and OG image.
 * Resolves Google News redirects to get actual article content.
 */
export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  try {
    // 1. Resolve Google News redirect if needed
    const actualUrl = await resolveGoogleNewsUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const res = await fetch(actualUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract OG image — try multiple sources, validate each
    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      // Fallback: first large image in article
      $("article img[src]").first().attr("src"),
      $('[role="main"] img[src]').first().attr("src"),
    ];

    let imageUrl: string | undefined;
    for (const candidate of candidates) {
      if (isValidImageUrl(candidate)) {
        // Make absolute URL if relative
        imageUrl = candidate!.startsWith("http")
          ? candidate!
          : new URL(candidate!, actualUrl).href;
        break;
      }
    }

    // Remove noise elements
    $(
      "script, style, nav, footer, aside, header, .ad, .advertisement, .sidebar, .comments, .social-share, [role='banner'], [role='navigation']"
    ).remove();

    // Try common article selectors in order
    const selectors = [
      "article",
      '[role="main"]',
      ".article-body",
      ".article-content",
      ".post-content",
      ".entry-content",
      "#article-body",
      ".story-body",
      "main",
    ];

    let text = "";
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        text = el.text().trim();
        break;
      }
    }

    // Fallback to body
    if (!text || text.length < 100) {
      text = $("body").text().trim();
    }

    // Clean: collapse whitespace, limit length
    text = text.replace(/\s+/g, " ").slice(0, MAX_ARTICLE_TEXT);

    return { text, imageUrl };
  } catch (err) {
    console.warn(`[Scraper] Failed for ${url}:`, (err as Error).message);
    return { text: "" };
  }
}

/**
 * Utility: sleep for the given milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
