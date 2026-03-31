import { NextRequest, NextResponse } from "next/server";
import { getPost, savePost } from "@/lib/content";

/**
 * DELETE /api/articles
 * Body: { date: string, articleId: string, password: string }
 *
 * Removes an article from a weekly post.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, articleId, password } = body;

    // Auth check — use CRON_SECRET as admin password
    const adminPassword = process.env.CRON_SECRET || "admin";
    if (password !== adminPassword) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!date || !articleId) {
      return NextResponse.json({ error: "Missing date or articleId" }, { status: 400 });
    }

    const post = getPost(date);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const before = post.articles.length;
    post.articles = post.articles.filter((a) => a.id !== articleId);
    post.articleCount = post.articles.length;

    if (post.articles.length === before) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    savePost(post);

    return NextResponse.json({
      success: true,
      remaining: post.articles.length,
      message: `Article ${articleId} removed.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
