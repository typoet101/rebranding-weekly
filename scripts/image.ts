/**
 * Override an article's thumbnail image URL.
 * Useful when the original source had no usable image (e.g. Google News
 * unresolved redirects) and we want to attach an image from somewhere else.
 *
 *   npx tsx scripts/image.ts                                     # interactive
 *   npx tsx scripts/image.ts 2026-06-15                          # interactive on week
 *   npx tsx scripts/image.ts 2026-06-15 <article-id> <imageUrl>  # direct set
 *   npx tsx scripts/image.ts --clear 2026-06-15 <article-id>     # clear override
 *   npx tsx scripts/image.ts --copy 2026-06-15 <src-id> <dst-id> # copy from another
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

function findArticle(post: RawPost, idOrIndex: string): RawArticle | undefined {
  // Try as article id first, then 1-based index
  let a = post.articles.find((x) => x.id === idOrIndex);
  if (a) return a;
  const idx = parseInt(idOrIndex, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= post.articles.length) {
    return post.articles[idx - 1];
  }
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const clear = args.includes("--clear");
  const copy = args.includes("--copy");
  const positional = args.filter((a) => a !== "--clear" && a !== "--copy");

  const weekDate =
    positional[0] && /^\d{4}-\d{2}-\d{2}$/.test(positional[0])
      ? positional.shift()!
      : latestWeekDate();

  const { filePath, post } = loadPost(weekDate);

  // --- Mode 1: clear ---
  if (clear) {
    const dstKey = positional[0];
    if (!dstKey) { console.error("Usage: --clear <week> <article-id-or-index>"); process.exit(1); }
    const a = findArticle(post, dstKey);
    if (!a) { console.error("Article not found"); process.exit(1); }
    delete a.imageUrl;
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    console.log(`✓ Cleared image on: ${a.title.slice(0, 70)}`);
    return;
  }

  // --- Mode 2: copy from another article in same week ---
  if (copy) {
    const [srcKey, dstKey] = positional;
    if (!srcKey || !dstKey) {
      console.error("Usage: --copy <week> <src-id-or-index> <dst-id-or-index>");
      process.exit(1);
    }
    const src = findArticle(post, srcKey);
    const dst = findArticle(post, dstKey);
    if (!src || !dst) { console.error("Article not found"); process.exit(1); }
    if (!hasRealImage(src)) { console.error("Source article has no usable image"); process.exit(1); }
    dst.imageUrl = src.imageUrl;
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    console.log(`✓ Copied image from "${src.title.slice(0,50)}" → "${dst.title.slice(0,50)}"`);
    return;
  }

  // --- Mode 3: direct set ---
  if (positional.length >= 2) {
    const [key, url] = positional;
    const a = findArticle(post, key);
    if (!a) { console.error("Article not found"); process.exit(1); }
    a.imageUrl = url;
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    console.log(`✓ Set image on: ${a.title.slice(0, 70)}`);
    console.log(`  imageUrl: ${url}`);
    return;
  }

  // --- Mode 4: interactive ---
  console.log(`\n=== ${weekDate} — articles ===\n`);
  post.articles.forEach((a, i) => {
    const img = hasRealImage(a) ? "📷" : "  ";
    const cat = a.category === "domestic" ? "KR" : "EN";
    console.log(`${img} ${String(i + 1).padStart(3)} ${cat}  ${a.title.slice(0, 75)}`);
  });

  const dstAns = await prompt("\n이미지를 바꿀 기사 번호: ");
  const dst = findArticle(post, dstAns.trim());
  if (!dst) { console.error("Invalid"); process.exit(1); }

  console.log("\n[1] 다른 기사에서 복사  [2] URL 직접 입력  [3] 비우기  [q] 취소");
  const mode = (await prompt("선택: ")).trim();

  if (mode === "1") {
    const srcAns = await prompt("이미지를 가져올 기사 번호: ");
    const src = findArticle(post, srcAns.trim());
    if (!src || !hasRealImage(src)) { console.error("Source has no usable image"); process.exit(1); }
    dst.imageUrl = src.imageUrl;
    console.log(`✓ Copied from: ${src.title.slice(0,60)}`);
  } else if (mode === "2") {
    const url = (await prompt("이미지 URL: ")).trim();
    if (!url) { console.error("Empty URL"); process.exit(1); }
    dst.imageUrl = url;
    console.log(`✓ Set imageUrl: ${url}`);
  } else if (mode === "3") {
    delete dst.imageUrl;
    console.log("✓ Cleared image");
  } else {
    console.log("Aborted.");
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`\nUpdated ${filePath}`);
  console.log("Don't forget: git add, commit, push.");
}

main().catch((err) => { console.error(err); process.exit(1); });
