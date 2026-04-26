/**
 * One-off script: generate (or regenerate) the featured hero image for an
 * existing weekly post and update its JSON.
 *
 *   npx tsx scripts/generate-featured.ts                # latest post
 *   npx tsx scripts/generate-featured.ts 2026-04-20     # specific week
 */
import fs from "fs";
import path from "path";

async function main() {
  const arg = process.argv[2];
  const { generateFeaturedImage } = await import(
    "../src/lib/collector/featured-image"
  );

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
  if (!fs.existsSync(filePath)) {
    console.error(`Post not found: ${filePath}`);
    process.exit(1);
  }

  const post = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Target: ${weekDate} — "${post.title}"`);

  const publicPath = await generateFeaturedImage(weekDate, post.title);
  if (!publicPath) {
    console.error("Image generation failed.");
    process.exit(1);
  }

  post.featuredImage = publicPath;
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`Updated ${filePath} with featuredImage: ${publicPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
