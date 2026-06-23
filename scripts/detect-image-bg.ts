/**
 * One-off + batch: scan a post's articles, detect logos / white-bg images,
 * and stamp imageFit="contain" on them.
 *
 *   npx tsx scripts/detect-image-bg.ts 2026-06-16
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.join(__dirname, "..", ".env.local"), override: true });

import { hasBlankBackground } from "../src/lib/collector/bg-detect";

const CONCURRENCY = 6;

async function main() {
  // Default to the most recent post if no date given (workflow use).
  let date = process.argv[2];
  if (!date) {
    const dir = "content/posts";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (files.length === 0) { console.error("No posts."); process.exit(1); }
    date = files[0].replace(".json", "");
    console.log(`(no arg) using latest: ${date}`);
  }

  const file = path.join("content/posts", `${date}.json`);
  const post = JSON.parse(fs.readFileSync(file, "utf-8"));
  const articles = post.articles as Array<{
    id: string;
    title: string;
    imageUrl?: string;
    imageFit?: "cover" | "contain";
  }>;

  const targets = articles.filter((a) =>
    a.imageUrl &&
    !a.imageUrl.includes("googleusercontent.com") &&
    a.imageFit !== "contain"
  );
  console.log(`${articles.length} articles | ${targets.length} to check`);

  let detected = 0;
  let done = 0;
  // Simple bounded concurrency
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const slice = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async (a) => {
        const blank = await hasBlankBackground(a.imageUrl!);
        done++;
        if (blank) {
          a.imageFit = "contain";
          detected++;
          console.log(`  [${done}/${targets.length}] ✓ contain: ${a.title.slice(0, 70)}`);
        } else {
          process.stdout.write(`  [${done}/${targets.length}] · cover\r`);
        }
      })
    );
  }

  console.log(`\n\nMarked ${detected} articles as imageFit=contain.`);
  fs.writeFileSync(file, JSON.stringify(post, null, 2) + "\n");
  console.log(`✓ Saved ${file}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
