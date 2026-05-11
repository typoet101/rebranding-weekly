import { NextRequest, NextResponse } from "next/server";
import { getPost } from "@/lib/content";
import { addDeleted, isKvAvailable, setHero, setStarred } from "@/lib/kv";

function checkAuth(password: string): boolean {
  const adminPassword = process.env.CRON_SECRET;
  if (!adminPassword) return false;
  return password === adminPassword;
}

function isValidArticleId(id: string): boolean {
  return /^[a-f0-9]{6,64}$/i.test(id);
}

/**
 * DELETE /api/articles
 * Body: { date, articleId, password }
 * Hides an article from public view by recording its ID in KV.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { date, articleId, password } = await request.json();

    if (!checkAuth(password)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    if (!date || !articleId || !isValidArticleId(articleId)) {
      return NextResponse.json({ error: "Missing or invalid date/articleId" }, { status: 400 });
    }
    if (!isKvAvailable()) {
      return NextResponse.json(
        { error: "KV not configured on this deployment" },
        { status: 503 }
      );
    }

    const post = getPost(date);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (!post.articles.find((a) => a.id === articleId)) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const overrides = await addDeleted(date, articleId);
    return NextResponse.json({ success: true, deletedIds: overrides.deletedIds });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * PATCH /api/articles
 * Body: { date, articleId, password, starred?: boolean, hero?: boolean }
 *   - starred: toggle BRIK's Pick on the article
 *   - hero:    set this article as the post hero (true) or clear it (false)
 *
 * Writes to Vercel KV — no filesystem mutation, works on any deployment.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { date, articleId, password, starred, hero } = await request.json();

    if (!checkAuth(password)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    if (!date || !articleId || !isValidArticleId(articleId)) {
      return NextResponse.json({ error: "Missing or invalid date/articleId" }, { status: 400 });
    }
    if (!isKvAvailable()) {
      return NextResponse.json(
        { error: "KV not configured on this deployment" },
        { status: 503 }
      );
    }

    const post = getPost(date);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (!post.articles.find((a) => a.id === articleId)) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    let result = { starredIds: [] as string[], heroArticleId: undefined as string | undefined };
    if (typeof starred === "boolean") {
      const o = await setStarred(date, articleId, starred);
      result.starredIds = o.starredIds;
    }
    if (typeof hero === "boolean") {
      const o = await setHero(date, articleId, hero);
      result.heroArticleId = o.heroArticleId;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
