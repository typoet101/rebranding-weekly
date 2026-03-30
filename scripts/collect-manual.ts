/**
 * Manual collection script.
 * Run: npx tsx scripts/collect-manual.ts
 *
 * Requires environment variables:
 *   ANTHROPIC_API_KEY — Claude API key
 *   NAVER_CLIENT_ID — Naver API client ID (optional)
 *   NAVER_CLIENT_SECRET — Naver API client secret (optional)
 */

import { config } from "dotenv";
import path from "path";

// Load .env.local from project root (override: true to ensure our key takes precedence)
config({ path: path.join(__dirname, "..", ".env.local"), override: true });

async function main() {
  // Dynamic import to ensure env vars are loaded first
  const { collect } = await import("../src/lib/collector/index");

  console.log("Starting manual collection...\n");

  const result = await collect();

  console.log("\n========================================");
  console.log("  Result");
  console.log("========================================");
  console.log(`  Success: ${result.success}`);
  console.log(`  Week: ${result.weekDate}`);
  console.log(`  Articles: ${result.articleCount}`);
  console.log(`  Message: ${result.message}`);
  console.log("========================================\n");

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error("Collection failed:", err);
  process.exit(1);
});
