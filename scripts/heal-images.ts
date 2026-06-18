/**
 * Image health check + auto-recovery for already-saved posts.
 *
 * Source sites occasionally replace or delete article images, leaving us with
 * cached imageUrl values that 404. This script scans recent posts, HEAD-checks
 * each imageUrl, and for any that fail it tries to re-extract the current
 * og:image from the article URL. If recovery fails too, the imageUrl is
 * cleared so the card falls back to its summary view.
 *
 *   npx tsx scripts/heal-images.ts                  # last 6 weeks
 *   npx tsx scripts/heal-images.ts 2026-06-15       # one week
 *   npx tsx scripts/heal-images.ts --all            # every post
 *   npx tsx scripts/heal-images.ts --dry-run        # report only, no writes
 */
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const RECENT_WEEKS = 6;
const CONCURRENCY = 6;

interface RawArticle {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  source: string;
}
interface RawPost {
  weekDate: string;
  articles: RawArticle[];
}

function listWeeks(): string[] {
  const dir = path.join(process.cwd(), "content", "posts");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .sort()
    .reverse();
}

function loadPost(weekDate: string): { filePath: string; post: RawPost } {
  const filePath = path.join(process.cwd(), "content", "posts", `${weekDate}.json`);
  return { filePath, post: JSON.parse(fs.readFileSync(filePath, "utf-8")) };
}

/** Process items with bounded concurrency. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");
  const explicitWeek = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

  let weeks: string[];
  if (explicitWeek) {
    weeks = [explicitWeek];
  } else if (all) {
    weeks = listWeeks();
  } else {
    weeks = listWeeks().slice(0, RECENT_WEEKS);
  }

  console.log(
    `Heal targets: ${weeks.length} week(s)${dryRun ? " (dry-run)" : ""}\n  ${weeks.join(", ")}\n`
  );

  const { verifyImage, refetchOgImage } = await import("../src/lib/collector/image-check");

  type Stat = { week: string; ok: number; healed: number; cleared: number; skipped: number };
  const stats: Stat[] = [];

  for (const week of weeks) {
    const { filePath, post } = loadPost(week);
    const targets = post.articles.filter((a) => !!a.imageUrl);
    const stat: Stat = { week, ok: 0, healed: 0, cleared: 0, skipped: 0 };

    const results = await mapPool(targets, CONCURRENCY, async (a) => {
      const before = a.imageUrl!;
      const stillWorks = await verifyImage(before);
      if (stillWorks) return { id: a.id, action: "ok" as const };

      // Try to recover from the source page
      const fresh = await refetchOgImage(a.url);
      if (fresh && fresh !== before) {
        return { id: a.id, action: "healed" as const, newUrl: fresh, oldUrl: before, title: a.title };
      }
      return { id: a.id, action: "cleared" as const, oldUrl: before, title: a.title };
    });

    for (const r of results) {
      if (r.action === "ok") {
        stat.ok++;
      } else if (r.action === "healed") {
        stat.healed++;
        console.log(`  ✓ HEAL [${week}] ${r.title.slice(0, 60)}`);
        console.log(`     ${r.oldUrl}`);
        console.log(`  → ${r.newUrl}`);
        if (!dryRun) {
          const target = post.articles.find((x) => x.id === r.id)!;
          target.imageUrl = r.newUrl;
        }
      } else if (r.action === "cleared") {
        stat.cleared++;
        console.log(`  ✕ CLEAR [${week}] ${r.title.slice(0, 60)}`);
        console.log(`     was: ${r.oldUrl}`);
        if (!dryRun) {
          const target = post.articles.find((x) => x.id === r.id)!;
          delete target.imageUrl;
        }
      }
    }
    stat.skipped = post.articles.length - targets.length;

    if (!dryRun && (stat.healed > 0 || stat.cleared > 0)) {
      fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
    }
    stats.push(stat);
  }

  console.log("\n=== Summary ===");
  let totalOk = 0,
    totalHealed = 0,
    totalCleared = 0;
  for (const s of stats) {
    totalOk += s.ok;
    totalHealed += s.healed;
    totalCleared += s.cleared;
    console.log(
      `  ${s.week}  ok:${s.ok}  healed:${s.healed}  cleared:${s.cleared}  no-image:${s.skipped}`
    );
  }
  console.log(`  TOTAL    ok:${totalOk}  healed:${totalHealed}  cleared:${totalCleared}`);
  if (!dryRun && (totalHealed > 0 || totalCleared > 0)) {
    console.log("\nDon't forget: git add, commit, push.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
