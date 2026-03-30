import Parser from "rss-parser";
import type { RawArticle } from "../types";
import {
  KEYWORDS,
  RSS_FEEDS,
  googleNewsRssUrl,
  naverNewsApiUrl,
  USER_AGENT,
} from "./sources";
import { isWithinDays } from "../dates";

const parser = new Parser({
  headers: { "User-Agent": USER_AGENT },
  timeout: 10000,
});

/**
 * Fetch all articles from all sources.
 * Returns raw articles (before scraping and summarization).
 */
export async function fetchAllRSS(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  // 1. Google News RSS for Korean keywords
  const koPromises = KEYWORDS.ko.map((keyword) =>
    fetchGoogleNews(keyword, "ko", "domestic")
  );

  // 2. Google News RSS for English keywords
  const enPromises = KEYWORDS.en.map((keyword) =>
    fetchGoogleNews(keyword, "en", "international")
  );

  // 3. Direct RSS feeds
  const feedPromises = RSS_FEEDS.map((feed) =>
    fetchDirectRSS(feed.url, feed.name, feed.category)
  );

  // 4. Naver News API
  const naverPromises = KEYWORDS.ko.map((keyword) =>
    fetchNaverNews(keyword)
  );

  const results = await Promise.allSettled([
    ...koPromises,
    ...enPromises,
    ...feedPromises,
    ...naverPromises,
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      console.warn("[RSS] Fetch failed:", result.reason?.message || result.reason);
    }
  }

  // Filter to last 7 days
  return articles.filter((a) => {
    if (!a.publishedAt) return true; // Keep if no date
    return isWithinDays(a.publishedAt, 7);
  });
}

/**
 * Fetch articles from Google News RSS for a keyword.
 */
async function fetchGoogleNews(
  keyword: string,
  lang: "ko" | "en",
  category: "domestic" | "international"
): Promise<RawArticle[]> {
  try {
    const url = googleNewsRssUrl(keyword, lang);
    const feed = await parser.parseURL(url);

    const articles: RawArticle[] = [];

    for (const item of feed.items || []) {
      // Google News RSS item.link is a redirect URL
      // Try to resolve to actual article URL
      const googleUrl = item.link || "";
      const resolvedUrl = await resolveGoogleRedirect(googleUrl);

      articles.push({
        title: cleanText(item.title || ""),
        source: item.creator || extractSourceFromTitle(item.title || ""),
        url: resolvedUrl,
        category,
        keyword,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString().split("T")[0]
          : "",
      });
    }

    return articles;
  } catch (err) {
    console.warn(`[Google News] Failed for "${keyword}" (${lang}):`, (err as Error).message);
    return [];
  }
}

/**
 * Resolve Google News redirect URL to the actual article URL.
 * Google News uses consent/redirect pages, so we follow HTTP redirects
 * and also parse HTML for the actual link.
 */
async function resolveGoogleRedirect(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Use "manual" redirect to capture the Location header
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check for redirect Location header
    const location = res.headers.get("location");
    if (location && !location.includes("google.com")) {
      return location;
    }

    // If no redirect, try following it
    if (res.status >= 300 && res.status < 400 && location) {
      return resolveGoogleRedirect(location);
    }

    // Try to parse HTML for the actual URL
    const html = await res.text();

    // Look for various redirect patterns in Google News HTML
    const patterns = [
      /data-n-au="([^"]+)"/,
      /href="(https?:\/\/(?!news\.google|accounts\.google|consent\.google)[^"]+)"[^>]*data-n/,
      /window\.location\s*=\s*['"]([^'"]+)['"]/,
      /http-equiv="refresh"[^>]*content="[^"]*url=([^"]+)"/i,
      /rel="canonical"\s+href="([^"]+)"/,
      /property="og:url"\s+content="([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1] && !match[1].includes("google.com")) {
        return match[1];
      }
    }

    // Fallback: look for any external link in an anchor tag
    const linkMatch = html.match(/<a[^>]+href="(https?:\/\/(?!google\.com|news\.google|accounts\.google|consent\.google)[^"]{20,})"[^>]*>/);
    if (linkMatch?.[1]) {
      return linkMatch[1];
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Fetch articles from a direct RSS feed.
 */
async function fetchDirectRSS(
  url: string,
  sourceName: string,
  category: "domestic" | "international"
): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(url);

    return (feed.items || [])
      .filter((item) => {
        // For Brand New / design feeds, keep all items
        // For general feeds, filter by rebrand-related keywords
        const title = (item.title || "").toLowerCase();
        const allKeywords = [...KEYWORDS.ko, ...KEYWORDS.en].map((k) => k.toLowerCase());
        return allKeywords.some((kw) => title.includes(kw)) || sourceName === "Brand New";
      })
      .map((item) => ({
        title: cleanText(item.title || ""),
        source: sourceName,
        url: item.link || "",
        category,
        keyword: "rss-feed",
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString().split("T")[0]
          : "",
      }));
  } catch (err) {
    console.warn(`[RSS] Failed for ${sourceName}:`, (err as Error).message);
    return [];
  }
}

/**
 * Fetch articles from Naver News API.
 */
async function fetchNaverNews(keyword: string): Promise<RawArticle[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[Naver] API credentials not configured, skipping");
    return [];
  }

  try {
    const url = naverNewsApiUrl(keyword);
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    return (data.items || []).map(
      (item: { title: string; originallink: string; pubDate: string; description: string }) => ({
        title: cleanText(stripHtml(item.title)),
        source: "Naver News",
        url: item.originallink || "",
        category: "domestic" as const,
        keyword,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString().split("T")[0]
          : "",
      })
    );
  } catch (err) {
    console.warn(`[Naver] Failed for "${keyword}":`, (err as Error).message);
    return [];
  }
}

/** Strip HTML tags */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

/** Clean text: normalize whitespace */
function cleanText(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

/** Extract source name from Google News title format: "Title - Source" */
function extractSourceFromTitle(title: string): string {
  const parts = title.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "Unknown";
}
