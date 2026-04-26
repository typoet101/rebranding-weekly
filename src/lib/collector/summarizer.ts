import Anthropic from "@anthropic-ai/sdk";
import type { RawArticle, Article } from "../types";
import crypto from "crypto";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
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
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
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
      });

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
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
    });

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
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a magazine editor for a weekly rebranding news digest.

Given these article titles from this week's rebranding news, generate:
1. A catchy, concise weekly headline (max 60 characters). Can mix Korean and English naturally.
2. A 3-sentence description summarizing the week's key rebranding highlights in Korean. Cover the most notable brand changes, trends, and their significance. (max 300 characters total)

Format:
TITLE: (headline)
DESC: (3-sentence description)

Article titles:
${articleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
        },
      ],
    });

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
