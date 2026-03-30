import * as cheerio from "cheerio";
import { USER_AGENT, MAX_ARTICLE_TEXT, SCRAPE_TIMEOUT_MS } from "./sources";

interface ScrapeResult {
  text: string;
  imageUrl?: string;
}

/**
 * Scrape an article page to extract body text and OG image.
 */
export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const res = await fetch(url, {
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

    // Extract OG image
    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      undefined;

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
