/**
 * Run topic-level deduplication on an existing weekly post.
 *
 *   npx tsx scripts/dedupe-existing.ts                # latest post
 *   npx tsx scripts/dedupe-existing.ts 2026-04-27     # specific week
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.join(__dirname, "..", ".env.local"), override: true });

async function main() {
  const arg = process.argv[2];
  const { deduplicateBySimilarTopic } = await import("../src/lib/collector/summarizer");

  const postsDir = path.join(process.cwd(), "content", "posts");
  let weekDate = arg;
  if (!weekDate) {
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (files.length === 0) { console.error("No posts."); process.exit(1); }
    weekDate = files[0].replace(".json", "");
  }

  const filePath = path.join(postsDir, `${weekDate}.json`);
  const post = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`${weekDate} — ${post.articles.length} articles`);
  console.log("Running topic-level dedup...");

  const before = post.articles.length;
  const deduped = await deduplicateBySimilarTopic(post.articles);

  if (deduped.length === before) {
    console.log("No duplicates detected.");
    return;
  }

  // Show what got dropped (for transparency)
  const keptIds = new Set(deduped.map((a: { id: string }) => a.id));
  const dropped = post.articles.filter((a: { id: string }) => !keptIds.has(a.id));
  console.log(`\nDropped ${dropped.length} duplicates:`);
  dropped.forEach((a: { source: string; title: string }) =>
    console.log(`  - [${a.source}] ${a.title.slice(0, 75)}`)
  );

  post.articles = deduped;
  post.articleCount = deduped.length;
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`\n✓ ${before} → ${deduped.length} articles`);
  console.log("Don't forget: git add, commit, push.");
}

main().catch((err) => { console.error(err); process.exit(1); });
