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
 * Deduplicate articles: 1 article per topic, from the best source.
 * Uses multi-pass matching: exact brand names → keyword overlap → Jaccard similarity.
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

  // 2. Group by topic — check against ALL articles in group, not just first
  const groups: { articles: RawArticle[]; allTokens: Set<string>; brands: Set<string> }[] = [];

  for (const article of urlDeduped) {
    const tokens = tokenize(article.title);
    if (tokens.size === 0) continue;
    const brands = extractBrands(article.title);

    let placed = false;
    for (const group of groups) {
      // Must be same category
      if (group.articles[0].category !== article.category) continue;

      // Match 1: shared brand name (strongest signal)
      if (brands.size > 0 && group.brands.size > 0) {
        const sharedBrands = [...brands].filter((b) => group.brands.has(b));
        if (sharedBrands.length > 0) {
          group.articles.push(article);
          for (const t of tokens) group.allTokens.add(t);
          for (const b of brands) group.brands.add(b);
          placed = true;
          break;
        }
      }

      // Match 2: Jaccard against ALL tokens in the group (not just first article)
      if (jaccardSimilarity(group.allTokens, tokens) > 0.25) {
        group.articles.push(article);
        for (const t of tokens) group.allTokens.add(t);
        for (const b of brands) group.brands.add(b);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push({
        articles: [article],
        allTokens: new Set(tokens),
        brands: new Set(brands),
      });
    }
  }

  // 3. From each topic group, pick only the BEST 1 article
  const result: RawArticle[] = [];

  for (const group of groups) {
    // Sort by source tier (tier 1 first), then by date (newest first)
    group.articles.sort((a, b) => {
      const tierDiff = getSourceTier(a.source) - getSourceTier(b.source);
      if (tierDiff !== 0) return tierDiff;
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    });

    // Take only the best 1
    result.push(group.articles[0]);
  }

  return result;
}

/**
 * Extract likely brand/company names from a title.
 * Looks for: English proper nouns, Korean company names, quoted terms.
 */
function extractBrands(title: string): Set<string> {
  const brands = new Set<string>();

  // Quoted terms: '카카오', "Starbucks"
  const quoted = title.match(/[''"]([\w\uAC00-\uD7AF]+)[''""]/g);
  if (quoted) {
    for (const q of quoted) {
      const clean = q.replace(/[''"]/g, "").trim().toLowerCase();
      if (clean.length >= 2) brands.add(clean);
    }
  }

  // English proper nouns (capitalized, 2+ chars): KGC, Starbucks, NC, Meta
  const english = title.match(/\b[A-Z][A-Za-z0-9]{1,20}\b/g);
  if (english) {
    // Filter out common non-brand words
    const ignore = new Set(["The", "This", "That", "With", "From", "After", "Before", "New", "All", "Its", "Has", "For"]);
    for (const word of english) {
      if (!ignore.has(word)) brands.add(word.toLowerCase());
    }
  }

  // Korean company/brand patterns: ~공사, ~카드, ~소프트, ~그룹 etc.
  const koreanBrand = title.match(/[\uAC00-\uD7AF]{2,}(?:공사|카드|소프트|그룹|전자|생명|화학|제약|식품|은행|증권|보험|건설|통신|항공|호텔|백화점|마트)/g);
  if (koreanBrand) {
    for (const kb of koreanBrand) brands.add(kb.toLowerCase());
  }

  // All-caps acronyms: KGC, HDC, BYC, CI, BI, NC
  const acronyms = title.match(/\b[A-Z]{2,10}\b/g);
  if (acronyms) {
    const ignoreAcronyms = new Set(["CI", "BI", "AI", "IT", "CEO", "IPO", "ESG", "PR", "IR", "TV", "UN", "EU"]);
    for (const acr of acronyms) {
      if (!ignoreAcronyms.has(acr)) brands.add(acr.toLowerCase());
    }
  }

  return brands;
}

/**
 * Dedup articles by their final (resolved) URL after scraping.
 * Prevents same-ID collisions when multiple Google News redirects point to the same article.
 */
export function deduplicateByResolvedUrl<T extends { url: string }>(articles: T[]): T[] {
  const seen = new Map<string, T>();
  for (const a of articles) {
    const norm = normalizeUrl(a.url);
    if (!seen.has(norm)) {
      seen.set(norm, a);
    }
  }
  return Array.from(seen.values());
}

/**
 * Normalize a URL for comparison.
 * Strips protocol, www, trailing slash, common tracking params.
 */
export function normalizeUrl(url: string): string {
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
