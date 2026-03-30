/** Search keywords by language */
export const KEYWORDS = {
  ko: [
    "리브랜딩",
    "브랜드 리뉴얼",
    "CI 변경",
    "BI 변경",
    "브랜드 아이덴티티",
    "로고 리뉴얼",
  ],
  en: [
    "rebranding",
    "brand refresh",
    "visual identity redesign",
    "logo redesign",
    "brand overhaul",
  ],
} as const;

/** Direct RSS feeds to monitor */
export const RSS_FEEDS = [
  {
    name: "Brand New",
    url: "https://www.underconsideration.com/brandnew/archives/rss.xml",
    category: "international" as const,
  },
  {
    name: "It's Nice That",
    url: "https://www.itsnicethat.com/rss/all",
    category: "international" as const,
  },
];

/**
 * Build Google News RSS URL for a keyword.
 */
export function googleNewsRssUrl(
  keyword: string,
  lang: "ko" | "en"
): string {
  const params =
    lang === "ko"
      ? { hl: "ko", gl: "KR", ceid: "KR:ko" }
      : { hl: "en", gl: "US", ceid: "US:en" };

  const q = encodeURIComponent(keyword);
  return `https://news.google.com/rss/search?q=${q}&hl=${params.hl}&gl=${params.gl}&ceid=${params.ceid}`;
}

/**
 * Build Naver News API URL for a keyword.
 */
export function naverNewsApiUrl(keyword: string, display = 10): string {
  const q = encodeURIComponent(keyword);
  return `https://openapi.naver.com/v1/search/news.json?query=${q}&display=${display}&sort=date`;
}

/** User-Agent for HTTP requests */
export const USER_AGENT =
  "Mozilla/5.0 (compatible; RebrandingWeekly/1.0; +https://rebranding-weekly.vercel.app)";

/** Max text length to send to Claude for summarization */
export const MAX_ARTICLE_TEXT = 3000;

/** Delay between scrape requests (ms) */
export const SCRAPE_DELAY_MS = 1000;

/** Scrape request timeout (ms) */
export const SCRAPE_TIMEOUT_MS = 10000;
