import fs from "fs";
import path from "path";

/**
 * Generate a featured hero image for the weekly post using Pollinations.ai
 * (free, no API key required). Saves to public/featured/{weekDate}.png and
 * returns the public path. On failure, returns null and the page will fall
 * back to using the first article's OG image.
 */
export async function generateFeaturedImage(
  weekDate: string,
  weeklyTitle: string
): Promise<string | null> {
  const outDir = path.join(process.cwd(), "public", "featured");
  const outPath = path.join(outDir, `${weekDate}.png`);
  const publicPath = `/featured/${weekDate}.png`;

  // Idempotent: skip if already exists
  if (fs.existsSync(outPath)) {
    console.log(`[Image] Featured image already exists: ${publicPath}`);
    return publicPath;
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Editorial magazine-cover prompt; avoid in-image text (rendering quality)
  const prompt = [
    "editorial magazine cover photography",
    "abstract conceptual still life about brand identity and rebranding",
    "elegant studio lighting",
    "muted warm palette, premium minimalist aesthetic",
    `themed loosely around: ${weeklyTitle}`,
    "no text, no logos, no watermarks, no captions",
  ].join(", ");

  // Deterministic per-week seed
  const seed = hashSeed(weekDate);

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1280&height=960&seed=${seed}&nologo=true&model=flux`;

  try {
    console.log("[Image] Generating featured image...");
    const res = await fetch(url, {
      // Pollinations can be slow when warm-starting; allow generous timeout
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      console.warn(`[Image] Pollinations returned HTTP ${res.status}`);
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5_000) {
      console.warn(`[Image] Suspiciously small response (${buf.length} bytes)`);
      return null;
    }

    fs.writeFileSync(outPath, buf);
    console.log(`[Image] Saved → ${publicPath} (${(buf.length / 1024).toFixed(0)}KB)`);
    return publicPath;
  } catch (err) {
    console.warn("[Image] Generation failed:", (err as Error).message);
    return null;
  }
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 1_000_000;
}
