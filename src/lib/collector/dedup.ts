import type { RawArticle } from "../types";

/**
 * Tier-1 major media outlets (higher priority).
 * Articles from these sources are preferred when deduplicating.
 */
const TIER1_SOURCES_KO = new Set([
  "연합뉴스", "중앙일보", "조선일보", "동아일보", "한국경제", "매일경제",
  "서울경제", "파이낸셜뉴스", "서울신문", "뉴스1", "뉴시스", "한겨레",
  "경향신문", "조선비즈", "머니투데이", "이데일리", "아시아경제",
  "디자인프레스", "디자인 나침반", "브랜드브리프", "패션비즈",
]);

const TIER1_SOURCES_EN = new Set([
  "Brand New", "It's Nice That", "Design Week", "Creative Bloq",
  "Reuters", "AP News", "Bloomberg", "The New York Times", "BBC",
  "CNN", "The Guardian", "Forbes", "Business Insider", "TechCrunch",
  "The Verge", "Wired", "Fast Company", "AdAge", "Campaign",
]);

function getSourceTier(source: string): number {
  if (TIER1_SOURCES_KO.has(source) || TIER1_SOURCES_EN.has(source)) return 1;
  return 2;
}

/**
 * Deduplicate articles and pick top 3 per topic from major media.
 * Groups similar articles together, then selects the best sources.
 */
export function deduplicate(articles: RawArticle[]): RawArticle[] {
  if (!articles.length) return [];

  // Skip articles with empty URLs
  const valid = articles.filter((a) => a.url);

  // 1. URL dedup first
  const urlSeen = new Map<string, RawArticle>();
  for (const article of valid) {
    const normUrl = normalizeUrl(article.url);
    if (!urlSeen.has(normUrl)) {
      urlSeen.set(normUrl, article);
    }
  }
  const urlDeduped = Array.from(urlSeen.values());

  // 2. Group by topic (title similarity)
  const groups: RawArticle[][] = [];

  for (const article of urlDeduped) {
    const tokens = tokenize(article.title);
    if (tokens.size === 0) continue;

    let placed = false;
    for (const group of groups) {
      const groupTokens = tokenize(group[0].title);
      if (
        group[0].category === article.category &&
        jaccardSimilarity(groupTokens, tokens) > 0.7
      ) {
        group.push(article);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([article]);
    }
  }

  // 3. From each topic group, pick up to 3 articles prioritizing major media
  const result: RawArticle[] = [];
  const MAX_PER_TOPIC = 5;

  for (const group of groups) {
    // Sort by source tier (tier 1 first), then by date (newest first)
    group.sort((a, b) => {
      const tierDiff = getSourceTier(a.source) - getSourceTier(b.source);
      if (tierDiff !== 0) return tierDiff;
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    });

    // Take top N
    const selected = group.slice(0, MAX_PER_TOPIC);
    result.push(...selected);
  }

  return result;
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
