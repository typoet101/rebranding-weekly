import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "..", ".env.local"), override: true });

async function main() {
  const { fetchAllRSS } = await import("../src/lib/collector/rss");
  const { deduplicate } = await import("../src/lib/collector/dedup");
  const { scrapeArticle } = await import("../src/lib/collector/scraper");

  const raw = await fetchAllRSS();
  const deduped = deduplicate(raw);
  const intl = deduped.filter(a => a.category === "international");
  
  console.log("International after dedup:", intl.length);
  
  for (const article of intl.slice(0, 5)) {
    const result = await scrapeArticle(article.url);
    console.log("\n---");
    console.log("Title:", article.title.substring(0, 70));
    console.log("URL:", article.url.substring(0, 100));
    console.log("Text length:", result.text.length);
    console.log("Text preview:", result.text.substring(0, 120));
  }
}
main();
