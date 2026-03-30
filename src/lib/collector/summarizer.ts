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
          `[Article ${idx + 1}]\nTitle: ${a.title}\nSource: ${a.source}\nText: ${a.text || "(text unavailable)"}`
      )
      .join("\n\n---\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a branding news editor. For each article below, provide a concise summary in 2-3 sentences.

Focus on:
- What brand is rebranding
- What changed (logo, visual identity, name, packaging, etc.)
- Why they rebranded (if mentioned)

Write the summary in the SAME LANGUAGE as the article (Korean articles → Korean summary, English articles → English summary).

If an article is NOT actually about rebranding or brand identity changes, respond with "NOT_RELEVANT" for that article.

Format your response as:
[Article 1]
(summary or NOT_RELEVANT)

[Article 2]
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
        const summary = sections[j]?.trim() || "";
        if (
          summary === "NOT_RELEVANT" ||
          summary.includes("NOT_RELEVANT") ||
          !summary
        ) {
          continue;
        }

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
