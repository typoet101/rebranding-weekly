/**
 * Pick which article's thumbnail becomes the homepage hero image.
 *
 *   npx tsx scripts/hero.ts                  # interactive: list latest, prompt one pick
 *   npx tsx scripts/hero.ts 2026-04-20       # interactive on specific week
 *   npx tsx scripts/hero.ts 2026-04-20 5     # set article #5 as hero
 *   npx tsx scripts/hero.ts --clear 2026-04-20   # clear hero (fall back to auto)
 */
import fs from "fs";
import path from "path";
import readline from "readline";

interface RawArticle {
  id: string;
  title: string;
  category: "domestic" | "international";
  imageUrl?: string;
  starred?: boolean;
}
interface RawPost {
  weekDate: string;
  articles: RawArticle[];
  heroArticleId?: string;
}

function loadPost(weekDate: string): { filePath: string; post: RawPost } {
  const filePath = path.join(process.cwd(), "content", "posts", `${weekDate}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Post not found: ${filePath}`);
    process.exit(1);
  }
  return { filePath, post: JSON.parse(fs.readFileSync(filePath, "utf-8")) };
}

function latestWeekDate(): string {
  const dir = path.join(process.cwd(), "content", "posts");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
  if (files.length === 0) { console.error("No posts."); process.exit(1); }
  return files[0].replace(".json", "");
}

async function prompt(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a); }));
}

function hasRealImage(a: RawArticle): boolean {
  return !!a.imageUrl && !a.imageUrl.includes("googleusercontent.com");
}

async function main() {
  const args = process.argv.slice(2);
  const clear = args.includes("--clear");
  const positional = args.filter((a) => a !== "--clear");

  const weekDate =
    positional[0] && /^\d{4}-\d{2}-\d{2}$/.test(positional[0])
      ? positional.shift()!
      : latestWeekDate();

  const { filePath, post } = loadPost(weekDate);

  if (clear) {
    delete post.heroArticleId;
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    console.log(`Hero cleared in ${weekDate}. Will fall back to first BRIK's Pick or first image.`);
    return;
  }

  let pick: number | undefined;
  if (positional.length > 0) {
    pick = parseInt(positional[0], 10);
  } else {
    console.log(`\n=== ${weekDate} — articles with images (only candidates with real OG images shown) ===`);
    post.articles.forEach((a, i) => {
      if (!hasRealImage(a)) return;
      const cur = a.id === post.heroArticleId ? " 🖼" : "  ";
      const star = a.starred ? "★" : " ";
      const cat = a.category === "domestic" ? "KR" : "EN";
      console.log(`${cur}${star} ${String(i + 1).padStart(3)} ${cat}  ${a.title.slice(0, 75)}`);
    });
    const ans = await prompt("\nEnter the article number to set as hero (empty to abort): ");
    if (!ans.trim()) { console.log("Aborted."); return; }
    pick = parseInt(ans, 10);
  }

  if (pick === undefined || isNaN(pick)) { console.error("Invalid number."); process.exit(1); }
  const article = post.articles[pick - 1];
  if (!article) { console.error("Out of range."); process.exit(1); }
  if (!hasRealImage(article)) {
    console.error(`Article #${pick} has no usable image. Pick one with 📷.`);
    process.exit(1);
  }

  post.heroArticleId = article.id;
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`\n🖼 Hero set: ${article.title.slice(0, 80)}`);
  console.log("Don't forget: git add, commit, push.");
}

main().catch((err) => { console.error(err); process.exit(1); });
