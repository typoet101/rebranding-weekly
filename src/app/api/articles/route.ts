import { NextRequest, NextResponse } from "next/server";
import { getPost, savePost } from "@/lib/content";

function checkAuth(password: string): boolean {
  const adminPassword = process.env.CRON_SECRET;
  if (!adminPassword) return false;
  return password === adminPassword;
}

/**
 * DELETE /api/articles
 * Body: { date, articleId, password }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { date, articleId, password } = await request.json();

    if (!checkAuth(password)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    if (!date || !articleId) {
      return NextResponse.json({ error: "Missing date or articleId" }, { status: 400 });
    }

    const post = getPost(date);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const before = post.articles.length;
    post.articles = post.articles.filter((a) => a.id !== articleId);
    post.articleCount = post.articles.length;

    if (post.articles.length === before) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    savePost(post);
    return NextResponse.json({ success: true, remaining: post.articles.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * PATCH /api/articles
 * Body: { date, articleId, password, starred?: boolean, hero?: boolean }
 *   - starred: toggle BRIK's Pick on the article
 *   - hero:    set this article as the post hero (true) or clear it (false)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { date, articleId, password, starred, hero } = await request.json();

    if (!checkAuth(password)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    if (!date || !articleId) {
      return NextResponse.json({ error: "Missing date or articleId" }, { status: 400 });
    }

    const post = getPost(date);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const article = post.articles.find((a) => a.id === articleId);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    if (typeof starred === "boolean") {
      article.starred = starred;
    }
    if (typeof hero === "boolean") {
      post.heroArticleId = hero ? articleId : undefined;
    }

    savePost(post);

    return NextResponse.json({
      success: true,
      starred: article.starred,
      heroArticleId: post.heroArticleId,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
