import * as cheerio from "cheerio";
import { USER_AGENT, MAX_ARTICLE_TEXT, SCRAPE_TIMEOUT_MS } from "./sources";

interface ScrapeResult {
  text: string;
  imageUrl?: string;
  resolvedUrl?: string;
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
  if (IMAGE_BLOCKLIST.some((b) => lower.includes(b))) return false;
  if (!lower.startsWith("http")) return false;
  if (url.length < 20) return false;
  return true;
}

/**
 * For Google News URLs, use Naver Search API to find the real article URL.
 * Falls back to direct site search if Naver API is not configured.
 */
async function searchRealArticleUrl(
  title: string,
  source: string
): Promise<string | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // Clean the title: remove source suffix ("Title - Source")
  const cleanTitle = title.replace(/\s*-\s*[^-]+$/, "").trim();
  if (!cleanTitle) return null;

  // Strategy 1: Naver Search API (reliable, no bot blocking)
  if (clientId && clientSecret) {
    try {
      const query = encodeURIComponent(cleanTitle);
      const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${query}&display=3&sort=sim`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(apiUrl, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        // Find the best match — prefer originallink
        for (const item of items) {
          const link = item.originallink || item.link;
          if (link && !link.includes("news.naver.com")) {
            return link;
          }
        }
        // Fallback to naver link
        if (items[0]?.link) return items[0].link;
      }
    } catch {
      // Fall through to strategy 2
    }
  }

  // Strategy 2: Direct site scrape attempt using source domain guess
  try {
    // Common Korean news site domains
    const domainMap: Record<string, string> = {
      "연합뉴스": "yna.co.kr", "중앙일보": "joongang.co.kr", "조선일보": "chosun.com",
      "동아일보": "donga.com", "한국경제": "hankyung.com", "매일경제": "mk.co.kr",
      "서울경제": "sedaily.com", "서울신문": "seoul.co.kr", "뉴스1": "news1.kr",
      "뉴시스": "newsis.com", "파이낸셜뉴스": "fnnews.com", "머니투데이": "mt.co.kr",
    };

    const domain = domainMap[source];
    if (domain) {
      const searchQuery = encodeURIComponent(cleanTitle);
      const siteSearchUrl = `https://search.naver.com/search.naver?query=${searchQuery}+site:${domain}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(siteSearchUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        // Naver search results have links in <a class="link_tit">
        const link = $("a.link_tit, a.news_tit").first().attr("href");
        if (link && !link.includes("naver.com")) return link;
      }
    }
  } catch {
    // Give up
  }

  return null;
}

/**
 * Scrape an article page to extract body text and OG image.
 * For Google News URLs, first searches for the real article URL.
 */
export async function scrapeArticle(
  url: string,
  title?: string,
  source?: string
): Promise<ScrapeResult> {
  try {
    let actualUrl = url;

    // If it's a Google News URL, search for the real article
    if (url.includes("news.google.com") && title && source) {
      const realUrl = await searchRealArticleUrl(title, source);
      if (realUrl) {
        actualUrl = realUrl;
      } else {
        // Can't resolve — return empty result (article will use title-only summary)
        return { text: "", resolvedUrl: url };
      }
    }

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
      $("article img[src]").first().attr("src"),
      $('[role="main"] img[src]').first().attr("src"),
    ];

    let imageUrl: string | undefined;
    for (const candidate of candidates) {
      if (isValidImageUrl(candidate)) {
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

    return { text, imageUrl, resolvedUrl: actualUrl };
  } catch (err) {
    console.warn(`[Scraper] Failed for ${url}:`, (err as Error).message);
    return { text: "", resolvedUrl: url };
  }
}

/**
 * Utility: sleep for the given milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
