import type { WeeklyPost } from "../types";
import { getMondayDate } from "../dates";
import { savePost, postExists } from "../content";
import { fetchAllRSS } from "./rss";
import { scrapeArticle, sleep } from "./scraper";
import { deduplicate } from "./dedup";
import { summarizeArticles, generateWeeklyTitle } from "./summarizer";
import { SCRAPE_DELAY_MS } from "./sources";

/**
 * Main collection orchestrator.
 * Fetches, deduplicates, scrapes, summarizes, and saves a weekly post.
 */
export async function collect(): Promise<{
  success: boolean;
  weekDate: string;
  articleCount: number;
  message: string;
}> {
  const weekDate = getMondayDate();

  console.log(`\n========================================`);
  console.log(`  Rebranding Weekly — Collection`);
  console.log(`  Week of: ${weekDate}`);
  console.log(`========================================\n`);

  // 1. Check idempotency
  if (postExists(weekDate)) {
    console.log(`[Skip] Post for ${weekDate} already exists.`);
    return {
      success: true,
      weekDate,
      articleCount: 0,
      message: `Post for ${weekDate} already exists.`,
    };
  }

  // 2. Fetch RSS feeds
  console.log("[1/6] Fetching RSS feeds...");
  const rawArticles = await fetchAllRSS();
  console.log(`  → Found ${rawArticles.length} raw articles`);

  if (rawArticles.length === 0) {
    console.log("[Done] No articles found. Skipping post creation.");
    return {
      success: true,
      weekDate,
      articleCount: 0,
      message: "No articles found this week.",
    };
  }

  // 3. Deduplicate
  console.log("[2/6] Deduplicating...");
  const domRaw = rawArticles.filter((a) => a.category === "domestic").length;
  const intlRaw = rawArticles.filter((a) => a.category === "international").length;
  console.log(`  → Raw: domestic ${domRaw}, international ${intlRaw}`);

  const uniqueArticles = deduplicate(rawArticles);
  const domDedup = uniqueArticles.filter((a) => a.category === "domestic").length;
  const intlDedup = uniqueArticles.filter((a) => a.category === "international").length;
  console.log(
    `  → ${uniqueArticles.length} unique (domestic ${domDedup}, international ${intlDedup}) — removed ${rawArticles.length - uniqueArticles.length} duplicates`
  );

  // 4. Scrape content
  console.log("[3/6] Scraping article content...");
  for (let i = 0; i < uniqueArticles.length; i++) {
    const article = uniqueArticles[i];
    console.log(
      `  [${i + 1}/${uniqueArticles.length}] ${article.title.slice(0, 60)}...`
    );

    const { text, imageUrl } = await scrapeArticle(article.url);
    article.text = text;
    if (imageUrl && !article.imageUrl) {
      article.imageUrl = imageUrl;
    }

    if (i < uniqueArticles.length - 1) {
      await sleep(SCRAPE_DELAY_MS);
    }
  }

  // 5. Summarize with Claude
  console.log("[4/6] Summarizing with Claude AI...");
  const articles = await summarizeArticles(uniqueArticles);
  console.log(`  → ${articles.length} relevant articles after AI filtering`);

  if (articles.length === 0) {
    console.log("[Done] No relevant articles after filtering. Skipping.");
    return {
      success: true,
      weekDate,
      articleCount: 0,
      message: "No relevant rebranding articles found this week.",
    };
  }

  // 6. Generate weekly title
  console.log("[5/6] Generating weekly title...");
  const { title, description } = await generateWeeklyTitle(
    articles.map((a) => a.title)
  );
  console.log(`  → Title: ${title}`);

  // 7. Save post
  console.log("[6/6] Saving post...");
  const post: WeeklyPost = {
    weekDate,
    title,
    description,
    createdAt: new Date().toISOString(),
    articleCount: articles.length,
    articles,
  };

  savePost(post);
  console.log(`\n✓ Post saved: content/posts/${weekDate}.json`);
  console.log(`  ${articles.length} articles (domestic: ${articles.filter((a) => a.category === "domestic").length}, international: ${articles.filter((a) => a.category === "international").length})`);

  return {
    success: true,
    weekDate,
    articleCount: articles.length,
    message: `Successfully collected ${articles.length} articles for ${weekDate}.`,
  };
}
