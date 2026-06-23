/**
 * For each article in a post whose URL is a Google News redirect AND whose
 * imageUrl is missing, decode the GN URL → fetch og:image from the real
 * article → update imageUrl + replace url with the decoded one.
 *
 *   npx tsx scripts/resolve-google-news.ts 2026-06-16
 *   npx tsx scripts/resolve-google-news.ts           # latest post
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import * as cheerio from "cheerio";
// @ts-expect-error - no types shipped
import GoogleNewsDecoder from "google-news-decoder";

config({ path: path.join(__dirname, "..", ".env.local"), override: true });

import { verifyImage } from "../src/lib/collector/image-check";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT_MS = 12000;
const CONCURRENCY = 4;

interface Article {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  [k: string]: unknown;
}

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $("article img[src]").first().attr("src"),
      $('[role="main"] img[src]').first().attr("src"),
    ];
    for (const c of candidates) {
      if (!c) continue;
      const abs = c.startsWith("http") ? c : new URL(c, articleUrl).href;
      if (abs.toLowerCase().includes("googleusercontent.com")) continue;
      if (await verifyImage(abs)) return abs;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  let date = process.argv[2];
  if (!date) {
    const dir = "content/posts";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (!files.length) { console.error("No posts."); process.exit(1); }
    date = files[0].replace(".json", "");
    console.log(`(no arg) using latest: ${date}`);
  }
  const file = path.join("content/posts", `${date}.json`);
  const post = JSON.parse(fs.readFileSync(file, "utf-8"));
  const articles: Article[] = post.articles;

  const targets = articles.filter((a) =>
    a.url.includes("news.google.com/rss/") && !a.imageUrl
  );
  console.log(`${articles.length} articles | ${targets.length} GN-redirects w/o image`);
  if (!targets.length) return;

  const decoder = new GoogleNewsDecoder();
  let resolved = 0, withImage = 0;

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const slice = targets.slice(i, i + CONCURRENCY);
    await Promise.all(slice.map(async (a) => {
      try {
        const decoded = await decoder.decodeGoogleNewsUrl(a.url);
        if (!decoded?.status || !decoded.decodedUrl) {
          console.log(`  ✗ decode fail: ${a.title.slice(0,50)}`);
          return;
        }
        a.url = decoded.decodedUrl;
        resolved++;
        const img = await fetchOgImage(decoded.decodedUrl);
        if (img) {
          a.imageUrl = img;
          withImage++;
          console.log(`  ✓ ${a.title.slice(0,55)} → og:image found`);
        } else {
          console.log(`  · url resolved but no og:image: ${a.title.slice(0,40)}`);
        }
      } catch (e) {
        console.log(`  ✗ ${a.title.slice(0,40)}: ${(e as Error).message}`);
      }
    }));
  }

  fs.writeFileSync(file, JSON.stringify(post, null, 2) + "\n");
  console.log(`\nResolved ${resolved}/${targets.length} URLs, ${withImage} got images.`);
  console.log(`✓ Saved ${file}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
