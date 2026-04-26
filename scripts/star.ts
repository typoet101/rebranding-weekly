/**
 * Mark / unmark articles as BRIK's Pick (starred) in a weekly post JSON.
 *
 *   npx tsx scripts/star.ts                 # interactive: list latest, prompt picks
 *   npx tsx scripts/star.ts 2026-04-20      # interactive on specific week
 *   npx tsx scripts/star.ts 2026-04-20 1 5 12   # mark articles by 1-based index
 *   npx tsx scripts/star.ts --clear 2026-04-20  # remove all stars in that week
 */
import fs from "fs";
import path from "path";
import readline from "readline";

interface RawArticle {
  id: string;
  title: string;
  source: string;
  category: "domestic" | "international";
  imageUrl?: string;
  starred?: boolean;
}

interface RawPost {
  weekDate: string;
  articles: RawArticle[];
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
  if (files.length === 0) {
    console.error("No posts.");
    process.exit(1);
  }
  return files[0].replace(".json", "");
}

async function prompt(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a); }));
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
    let cleared = 0;
    for (const a of post.articles) {
      if (a.starred) { delete a.starred; cleared++; }
    }
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    console.log(`Cleared ${cleared} stars in ${weekDate}.`);
    return;
  }

  let picks: number[];
  if (positional.length > 0) {
    picks = positional.map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
  } else {
    console.log(`\n=== ${weekDate} — articles ===`);
    post.articles.forEach((a, i) => {
      const tag = a.starred ? " ★" : "  ";
      const cat = a.category === "domestic" ? "KR" : "EN";
      const img = a.imageUrl && !a.imageUrl.includes("googleusercontent.com") ? "📷" : "  ";
      console.log(
        `${tag} ${String(i + 1).padStart(3)} ${cat} ${img}  ${a.title.slice(0, 70)}`
      );
    });
    const ans = await prompt(
      "\nEnter pick numbers separated by space (e.g. '3 5 12'), or empty to abort: "
    );
    if (!ans.trim()) {
      console.log("Aborted.");
      return;
    }
    picks = ans
      .split(/\s+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
  }

  // Reset all stars first, then set the chosen ones
  for (const a of post.articles) delete a.starred;
  let marked = 0;
  for (const idx of picks) {
    const a = post.articles[idx - 1];
    if (a) {
      a.starred = true;
      marked++;
      console.log(`★ ${idx}: ${a.title.slice(0, 70)}`);
    } else {
      console.warn(`(skipped ${idx} — out of range)`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`\n✓ ${marked} starred in ${filePath}`);
  console.log("Don't forget: git add, commit, push.");
}

main().catch((err) => { console.error(err); process.exit(1); });
