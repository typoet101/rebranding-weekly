import fs from "fs";
import path from "path";
import type { WeeklyPost, PostMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

/**
 * Get all post file dates (sorted newest first).
 */
export function getAllPostDates(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .sort((a, b) => b.localeCompare(a));
}

/**
 * Validate date format to prevent path traversal.
 */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Read a single weekly post by date.
 */
export function getPost(date: string): WeeklyPost | null {
  if (!isValidDate(date)) return null;
  const filePath = path.join(CONTENT_DIR, `${date}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as WeeklyPost;
}

/**
 * Get the latest (most recent) post.
 */
export function getLatestPost(): WeeklyPost | null {
  const dates = getAllPostDates();
  if (dates.length === 0) return null;
  return getPost(dates[0]);
}

/**
 * Get metadata for all posts (for archive listing).
 */
export function getAllPostMetas(): PostMeta[] {
  const dates = getAllPostDates();

  return dates.map((date) => {
    const post = getPost(date)!;
    return {
      weekDate: post.weekDate,
      title: post.title,
      description: post.description,
      articleCount: post.articleCount,
      domesticCount: post.articles.filter((a) => a.category === "domestic").length,
      internationalCount: post.articles.filter((a) => a.category === "international").length,
    };
  });
}

/**
 * Save a weekly post to a JSON file.
 */
export function savePost(post: WeeklyPost): void {
  if (!isValidDate(post.weekDate)) throw new Error("Invalid date format");
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const filePath = path.join(CONTENT_DIR, `${post.weekDate}.json`);
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
}

/**
 * Check if a post already exists for the given date.
 */
export function postExists(date: string): boolean {
  if (!isValidDate(date)) return false;
  const filePath = path.join(CONTENT_DIR, `${date}.json`);
  return fs.existsSync(filePath);
}
