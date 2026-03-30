import type { RawArticle } from "../types";

/**
 * Deduplicate articles using URL normalization and title similarity.
 */
export function deduplicate(articles: RawArticle[]): RawArticle[] {
  const seen = new Map<string, RawArticle>();
  const titleEntries: { tokens: Set<string>; article: RawArticle }[] = [];

  for (const article of articles) {
    // Skip articles with empty URLs
    if (!article.url) continue;

    // 1. URL dedup
    const normUrl = normalizeUrl(article.url);
    if (seen.has(normUrl)) continue;

    // 2. Title similarity dedup (within same category only)
    const tokens = tokenize(article.title);
    if (tokens.size === 0) continue;

    const isDuplicate = titleEntries.some(
      (entry) =>
        entry.article.category === article.category &&
        jaccardSimilarity(entry.tokens, tokens) > 0.7
    );

    if (isDuplicate) continue;

    seen.set(normUrl, article);
    titleEntries.push({ tokens, article });
  }

  return Array.from(seen.values());
}

/**
 * Normalize a URL for comparison.
 * Strips protocol, www, trailing slash, common tracking params.
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove tracking params
    const removeParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
      "ref", "source", "fbclid", "gclid",
    ];
    for (const p of removeParams) {
      u.searchParams.delete(p);
    }
    // Normalize
    let normalized = u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
    const search = u.searchParams.toString();
    if (search) normalized += "?" + search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Tokenize a title into a set of lowercase words.
 * Removes common stop words.
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    // Korean particles & common words
    "의", "에", "를", "을", "이", "가", "은", "는", "와", "과", "도", "로",
    "에서", "한", "된", "하는", "하다", "있다", "없다", "것",
    // English stop words
    "the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
    "to", "for", "of", "with", "by", "from", "and", "or", "its", "it",
    "this", "that", "as", "new", "has", "have",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s\uAC00-\uD7AF]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Compute Jaccard similarity between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
