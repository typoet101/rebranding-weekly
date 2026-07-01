import Anthropic from "@anthropic-ai/sdk";
import type { RawArticle, Article } from "../types";
import crypto from "crypto";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    // 2026-06-30 발행 실패는 Anthropic API의 "Premature close" (스트림
    // 조기 종료) 오류로 모든 배치가 fallback으로 빠져 sanity check가 잡음.
    // SDK 기본 retry는 2회지만 이런 flaky 네트워크 케이스에 부족했으므로
    // 5회로 늘림. 타임아웃도 60초 → 90초로 여유.
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 5,
      timeout: 90_000,
    });
  }
  return client;
}

/**
 * Outer retry wrapper for individual Anthropic calls. The SDK already retries
 * on transient errors, but a persistent "Premature close" on a specific
 * request needs an extra outer loop with backoff to give the API time to
 * recover before the same batch is retried.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  label = "call"
): Promise<T> {
  let lastErr: Error | undefined;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      if (i < attempts - 1) {
        const delay = 2000 * Math.pow(2, i); // 2s, 4s, 8s
        console.warn(`[${label}] attempt ${i + 1}/${attempts} failed: ${lastErr.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

/**
 * Summarize a batch of raw articles using Claude.
 * Returns Article objects with AI summaries.
 * Articles deemed not relevant are filtered out.
 */
export async function summarizeArticles(
  rawArticles: RawArticle[]
): Promise<Article[]> {
  const anthropic = getClient();
  const results: Article[] = [];

  // Process in batches of 5
  const batchSize = 5;
  for (let i = 0; i < rawArticles.length; i += batchSize) {
    const batch = rawArticles.slice(i, i + batchSize);

    const articlesText = batch
      .map(
        (a, idx) =>
          `[Article ${idx + 1}]\nTitle: ${a.title}\nSource: ${a.source}\nText: ${a.text && a.text.length > 50 ? a.text : "(text unavailable — use title only)"}`
      )
      .join("\n\n---\n\n");

    try {
      const response = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a branding news editor. For each article below, provide:
1. A concise summary in 2-3 sentences
2. An industry category

Focus on:
- What brand is rebranding
- What changed (logo, visual identity, name, packaging, etc.)
- Why they rebranded (if mentioned)

IMPORTANT: Write ALL summaries in Korean (한국어), regardless of the article's original language.

IMPORTANT: If the article text is unavailable, write a brief summary based on the title alone. Only respond with "NOT_RELEVANT" if the title clearly has nothing to do with rebranding, brand identity changes, logo redesign, or corporate name changes.

Industry categories (pick exactly one):
식음료, 뷰티·패션, IT·테크, 금융·보험, 유통·리테일, 자동차, 엔터·미디어, 공공·기관, 스포츠, 건설·부동산, 제약·헬스, 교육, 기타

Format your response as:
[Article 1]
INDUSTRY: (category)
(summary or NOT_RELEVANT)

[Article 2]
INDUSTRY: (category)
(summary or NOT_RELEVANT)

...

${articlesText}`,
          },
        ],
      }), 3, "summarize-batch");

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Parse responses
      const sections = text.split(/\[Article \d+\]/g).filter((s) => s.trim());

      for (let j = 0; j < batch.length; j++) {
        const section = sections[j]?.trim() || "";
        if (
          section === "NOT_RELEVANT" ||
          section.includes("NOT_RELEVANT") ||
          !section
        ) {
          continue;
        }

        // Extract industry tag
        const industryMatch = section.match(/INDUSTRY:\s*(.+)/);
        const industry = industryMatch?.[1]?.trim() || undefined;
        // Remove INDUSTRY line from summary
        const summary = section.replace(/INDUSTRY:\s*.+\n?/, "").trim();

        if (!summary) continue;

        const raw = batch[j];
        results.push({
          id: generateId(raw.url),
          title: raw.title,
          source: raw.source,
          url: raw.url,
          summary,
          category: raw.category,
          keyword: raw.keyword,
          publishedAt: raw.publishedAt,
          imageUrl: raw.imageUrl,
          industry,
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("[Summarizer] Batch failed:", (err as Error).message);
      // On failure, include articles without summary
      for (const raw of batch) {
        results.push({
          id: generateId(raw.url),
          title: raw.title,
          source: raw.source,
          url: raw.url,
          summary: "(요약을 생성하지 못했습니다.)",
          category: raw.category,
          keyword: raw.keyword,
          publishedAt: raw.publishedAt,
          imageUrl: raw.imageUrl,
          scrapedAt: new Date().toISOString(),
        });
      }
    }
  }

  return results;
}

/**
 * Detect groups of articles covering the same news event (different outlets
 * reporting the same brand launch / announcement) and keep only ONE article
 * per group, preferring major mainstream media.
 *
 * This is a single Claude call regardless of input size (titles only — cheap).
 * Returns the input unchanged if no duplicates are detected.
 */
export async function deduplicateBySimilarTopic(
  articles: Article[]
): Promise<Article[]> {
  if (articles.length <= 1) return articles;

  const anthropic = getClient();

  const list = articles
    .map(
      (a, i) =>
        `[${i + 1}] [${a.category === "domestic" ? "KR" : "EN"}] ${a.title.replace(/\s+/g, " ")} — ${a.source}`
    )
    .join("\n");

  const prompt = `You are a senior news editor. Many articles below cover the SAME NEWS EVENT from different outlets (e.g., one brand launch reported by 5 different newspapers — same image, same facts, slightly different titles).

Identify duplicate/near-duplicate groups and KEEP ONLY ONE per group.

A "group" is broader than identical news. **Group together aggressively** when articles share:
- Same brand/company AND same underlying event (rebrand, launch, BI change, anniversary campaign, new store, leadership change, M&A) — even if titles emphasize different angles ("logo reveal" vs "lifestyle brand evolution" vs "20th anniversary" vs "service expansion" are usually the SAME event)
- Same product/announcement reported by multiple outlets (press-release driven coverage)
- A brand mentioned 3+ times in the same week → almost certainly the same campaign; collapse to 1–2 strongest sources

Err on the side of MORE deduplication. Readers prefer one strong piece per topic over four overlapping ones.

KEEP priority within a duplicate group:
1. Major mainstream outlet
   - KR: 연합뉴스, 뉴시스, 뉴스1, 조선일보, 중앙일보, 동아일보, 한겨레, 경향신문, 매일경제, 한국경제, 머니투데이, 비즈니스포스트, 딜사이트, 한국일보, KBS, MBC, SBS, JTBC, YTN, Naver News
   - EN/Global: Reuters, Bloomberg, Financial Times, Wall Street Journal, New York Times, Guardian, BBC, Forbes, Fast Company, Adweek, Brand New, Campaign, Marketing Week, AdAge, Dezeen
2. Most original/primary source (exclusive report, brand's own announcement)
3. Richest, most informative title

Standalone articles (no duplicates) MUST also be kept.

Return ONLY a JSON array of the [N] indices to KEEP, sorted in ascending order. No prose, no markdown fences.
Example: [1, 3, 5, 8, 12, 15, ...]

Articles:

${list}`;

  try {
    const response = await withRetry(() => anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }), 3, "topic-dedup");

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) {
      console.warn("[TopicDedup] No JSON array in response — keeping all");
      return articles;
    }

    const indices: number[] = JSON.parse(match[0]);
    const seen = new Set<number>();
    const kept: Article[] = [];
    for (const idx of indices) {
      if (typeof idx !== "number" || seen.has(idx)) continue;
      const a = articles[idx - 1];
      if (a) {
        kept.push(a);
        seen.add(idx);
      }
    }

    // Safety: if AI returned nothing or way too few, fall back to all
    if (kept.length === 0 || kept.length < articles.length * 0.3) {
      console.warn(
        `[TopicDedup] Suspiciously aggressive (${kept.length}/${articles.length}) — keeping all`
      );
      return articles;
    }

    return kept;
  } catch (err) {
    console.warn("[TopicDedup] Failed:", (err as Error).message);
    return articles;
  }
}

/**
 * Curate international articles down to the most significant ones.
 * Uses Claude to rank by impact (brand prominence, scope of change,
 * global relevance) and keeps the top N. Returns the input unchanged
 * if it already fits under the limit.
 */
export async function curateInternational(
  articles: Article[],
  limit: number
): Promise<Article[]> {
  if (articles.length <= limit) return articles;

  const anthropic = getClient();

  const list = articles
    .map(
      (a, idx) =>
        `[${idx + 1}] ${a.title}\n    source: ${a.source}\n    summary: ${a.summary.replace(/\s+/g, " ").slice(0, 220)}`
    )
    .join("\n\n");

  try {
    const response = await withRetry(() => anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are the senior editor of a weekly rebranding digest. From the international rebranding articles below, pick the ${limit} most SIGNIFICANT cases.

"Significant" means:
- Major or globally recognizable brands (Fortune 500, household names, category leaders)
- Substantive identity changes (new logo system, full visual identity overhaul, name change, repositioning) — NOT minor tweaks, single product packaging, or generic news
- Strategic / industry-shaping moves with broad impact
- Distinct cases (avoid near-duplicates of the same brand event)

DROP:
- Local / regional stories with no global resonance
- Speculative pieces, op-eds, listicles
- Generic "branding tips" without a specific company case
- Articles that are barely about rebranding

Return ONLY a JSON array of the chosen article numbers (the [N] indices), ordered by importance (most significant first). No prose, no markdown fences. Example: [3, 12, 7, 1, ...]

Articles:

${list}`,
        },
      ],
    }), 3, "curate-intl");

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) {
      console.warn("[Curate] No JSON array in response — keeping first N as fallback");
      return articles.slice(0, limit);
    }

    const indices: number[] = JSON.parse(match[0]);
    const selected: Article[] = [];
    const seen = new Set<number>();
    for (const idx of indices) {
      if (typeof idx !== "number" || seen.has(idx)) continue;
      const a = articles[idx - 1];
      if (a) {
        selected.push(a);
        seen.add(idx);
      }
      if (selected.length >= limit) break;
    }

    if (selected.length === 0) {
      console.warn("[Curate] No valid indices — keeping first N as fallback");
      return articles.slice(0, limit);
    }

    return selected;
  } catch (err) {
    console.warn("[Curate] Ranking failed, keeping first N:", (err as Error).message);
    return articles.slice(0, limit);
  }
}

/**
 * Generate a weekly title and description from article titles.
 */
export async function generateWeeklyTitle(
  articleTitles: string[]
): Promise<{ title: string; description: string }> {
  const anthropic = getClient();

  try {
    const response = await withRetry(() => anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a magazine editor for a weekly rebranding news digest.

Given these article titles from this week's rebranding news, generate:
1. A catchy, concise weekly headline (max 60 characters). Can mix Korean and English naturally.
2. A 3-sentence description summarizing the week's key rebranding highlights in Korean. Cover the most notable brand changes, trends, and their significance. (max 300 characters total)

IMPORTANT — Korean style rules for the DESC:
- Use the spoken polite form 합쇼체 ending every sentence with "~합니다 / ~입니다 / ~했습니다 / ~됐습니다" etc.
- DO NOT use the written declarative 해라체 ("~다 / ~했다 / ~된다 / ~이다").
- Tone is like talking to a reader directly: warm, clear, informative.
- Example good ending: "변화의 물결이 이어지고 있습니다."
- Example bad ending: "변화의 물결이 이어지고 있다."

Format:
TITLE: (headline)
DESC: (3-sentence description, all sentences ending in ~합니다 polite form)

Article titles:
${articleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
        },
      ],
    }), 3, "weekly-title");

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const titleMatch = text.match(/TITLE:\s*(.+)/);
    const descMatch = text.match(/DESC:\s*(.+)/);

    return {
      title: titleMatch?.[1]?.trim() || "This Week in Rebranding",
      description:
        descMatch?.[1]?.trim() || "이번 주 주요 리브랜딩 소식을 모았습니다.",
    };
  } catch (err) {
    console.error("[Summarizer] Weekly title generation failed:", (err as Error).message);
    return {
      title: "This Week in Rebranding",
      description: "이번 주 주요 리브랜딩 소식을 모았습니다.",
    };
  }
}

/**
 * Generate a short ID from URL using SHA-256.
 */
function generateId(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 12);
}
