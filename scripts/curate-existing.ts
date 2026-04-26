/**
 * One-off: re-curate the international section of an existing weekly post
 * down to the configured limit.
 *
 *   npx tsx scripts/curate-existing.ts                 # latest post
 *   npx tsx scripts/curate-existing.ts 2026-04-20      # specific week
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const LIMIT = 16;

async function main() {
  const arg = process.argv[2];
  const { curateInternational } = await import("../src/lib/collector/summarizer");

  const postsDir = path.join(process.cwd(), "content", "posts");
  let weekDate = arg;
  if (!weekDate) {
    const files = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) {
      console.error("No posts found.");
      process.exit(1);
    }
    weekDate = files[0].replace(".json", "");
  }

  const filePath = path.join(postsDir, `${weekDate}.json`);
  const post = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const intl = post.articles.filter((a: { category: string }) => a.category === "international");
  const dom = post.articles.filter((a: { category: string }) => a.category === "domestic");

  console.log(`${weekDate} — domestic: ${dom.length}, international: ${intl.length}`);

  if (intl.length <= LIMIT) {
    console.log(`Already under limit (${LIMIT}). No action.`);
    return;
  }

  console.log(`Curating international ${intl.length} → top ${LIMIT}...`);
  const curated = await curateInternational(intl, LIMIT);
  console.log(`Done. ${curated.length} kept.`);

  const next = { ...post, articles: [...dom, ...curated], articleCount: dom.length + curated.length };
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), "utf-8");
  console.log(`Updated ${filePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
