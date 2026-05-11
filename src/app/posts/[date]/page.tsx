import { notFound } from "next/navigation";
import { getAllPostDates, getPost, getPostWithOverrides } from "@/lib/content";

// KV overrides should reflect immediately for any post page.
export const revalidate = 0;
import WeeklyHeader from "@/components/WeeklyHeader";
import PostView from "@/components/PostView";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import type { Metadata } from "next";

const SITE_URL = "https://rebranding-brik.vercel.app";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  const dates = getAllPostDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const post = getPost(date);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | Rebranding Weekly`,
      description: post.description,
      type: "article",
      publishedTime: post.createdAt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { date } = await params;
  const post = await getPostWithOverrides(date);

  if (!post) notFound();

  // Find prev/next posts for navigation
  const allDates = getAllPostDates();
  const currentIndex = allDates.indexOf(date);
  const newerDate = currentIndex > 0 ? allDates[currentIndex - 1] : null;
  const olderDate = currentIndex < allDates.length - 1 ? allDates[currentIndex + 1] : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <WeeklyHeader
        weekDate={post.weekDate}
        title={post.title}
        description={post.description}
        articleCount={post.articleCount}
      />

      <div className="flex justify-center mb-6">
        <ShareButtons
          title={`${post.title} | Rebranding Weekly`}
          description={post.description}
          url={`${SITE_URL}/posts/${post.weekDate}`}
          imageUrl={post.featuredImage ? `${SITE_URL}${post.featuredImage}` : undefined}
        />
      </div>

      <PostView
        weekDate={post.weekDate}
        initialArticles={post.articles}
        initialHeroId={post.heroArticleId}
      />

      {/* Navigation */}
      <nav className="flex justify-between items-center py-16 border-t border-border mt-10">
        <div>
          {olderDate && (
            <Link
              href={`/posts/${olderDate}`}
              className="text-small text-muted hover:text-primary no-underline hover:no-underline transition-colors"
            >
              &larr; Previous week
            </Link>
          )}
        </div>
        <Link
          href="/archive"
          className="text-small text-muted hover:text-primary no-underline hover:no-underline transition-colors uppercase tracking-widest"
        >
          Archive
        </Link>
        <div>
          {newerDate && (
            <Link
              href={`/posts/${newerDate}`}
              className="text-small text-muted hover:text-primary no-underline hover:no-underline transition-colors"
            >
              Next week &rarr;
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
