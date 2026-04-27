import type { WeeklyPost } from "../types";
import { getMondayDate } from "../dates";
import { savePost, postExists } from "../content";
import { fetchAllRSS } from "./rss";
import { scrapeArticle, sleep } from "./scraper";
import { deduplicate, deduplicateByResolvedUrl } from "./dedup";
import { summarizeArticles, generateWeeklyTitle, curateInternational, deduplicateBySimilarTopic } from "./summarizer";
import { SCRAPE_DELAY_MS } from "./sources";

const INTERNATIONAL_LIMIT = 16;

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

    const { text, imageUrl, resolvedUrl } = await scrapeArticle(
      article.url,
      article.title,
      article.source
    );
    article.text = text;
    if (resolvedUrl && resolvedUrl !== article.url) {
      article.url = resolvedUrl; // Use the real article URL
    }
    if (imageUrl && !article.imageUrl) {
      article.imageUrl = imageUrl;
    }

    if (i < uniqueArticles.length - 1) {
      await sleep(SCRAPE_DELAY_MS);
    }
  }

  // 4-b. Second dedup pass: multiple Google News URLs may resolve to the same real URL
  const beforeResolvedDedup = uniqueArticles.length;
  const resolvedUnique = deduplicateByResolvedUrl(uniqueArticles);
  if (resolvedUnique.length < beforeResolvedDedup) {
    console.log(`  → Removed ${beforeResolvedDedup - resolvedUnique.length} post-scrape URL duplicates`);
  }

  // 5. Summarize with Claude
  console.log("[4/6] Summarizing with Claude AI...");
  const summarized = await summarizeArticles(resolvedUnique);
  console.log(`  → ${summarized.length} relevant articles after AI filtering`);

  // 5-b. Topic-level dedup: drop near-duplicate stories (same event, different outlets)
  console.log("[4-b] Deduplicating by topic (same-event coverage)...");
  const beforeTopic = summarized.length;
  const deduped = await deduplicateBySimilarTopic(summarized);
  if (deduped.length < beforeTopic) {
    console.log(`  → Removed ${beforeTopic - deduped.length} duplicate-topic articles`);
  } else {
    console.log(`  → No topic duplicates detected`);
  }

  // 5-c. Curate international down to top N most significant cases
  const intlBefore = deduped.filter((a) => a.category === "international");
  const domestic = deduped.filter((a) => a.category === "domestic");
  let intlAfter = intlBefore;
  if (intlBefore.length > INTERNATIONAL_LIMIT) {
    console.log(
      `  [Curate] International: ${intlBefore.length} → ranking top ${INTERNATIONAL_LIMIT} by significance...`
    );
    intlAfter = await curateInternational(intlBefore, INTERNATIONAL_LIMIT);
    console.log(`  → International curated to ${intlAfter.length} articles`);
  }
  const articles = [...domestic, ...intlAfter];

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

  // 7. Save post (hero image is the lead article's photo, picked at render time)
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
