export interface Article {
  /** URL hash (first 12 chars of SHA-256) */
  id: string;
  /** Article headline */
  title: string;
  /** Publisher name */
  source: string;
  /** Original article URL */
  url: string;
  /** AI-generated 2-3 sentence summary */
  summary: string;
  /** domestic = 국내, international = 해외 */
  category: "domestic" | "international";
  /** Which search keyword matched this article */
  keyword: string;
  /** ISO date string from source */
  publishedAt: string;
  /** OG image URL if available */
  imageUrl?: string;
  /** ISO timestamp when collected */
  scrapedAt: string;
  /** Industry category (auto-classified by AI) */
  industry?: string;
  /** Admin-pinned to top */
  starred?: boolean;
}

export interface WeeklyPost {
  /** Monday date in YYYY-MM-DD format */
  weekDate: string;
  /** AI-generated weekly headline */
  title: string;
  /** AI-generated 1-sentence summary of the week */
  description: string;
  /** ISO timestamp when post was created */
  createdAt: string;
  /** Total number of articles */
  articleCount: number;
  /** Collected articles */
  articles: Article[];
}

/** Raw article before AI summarization */
export interface RawArticle {
  title: string;
  source: string;
  url: string;
  category: "domestic" | "international";
  keyword: string;
  publishedAt: string;
  imageUrl?: string;
  text?: string;
}

/** Post metadata for archive listing */
export interface PostMeta {
  weekDate: string;
  title: string;
  description: string;
  articleCount: number;
  domesticCount: number;
  internationalCount: number;
}
