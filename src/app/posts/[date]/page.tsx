import { notFound } from "next/navigation";
import { getAllPostDates, getPost } from "@/lib/content";
import WeeklyHeader from "@/components/WeeklyHeader";
import SectionDivider from "@/components/SectionDivider";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";
import type { Metadata } from "next";

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
  const post = getPost(date);

  if (!post) notFound();

  const domestic = post.articles.filter((a) => a.category === "domestic");
  const international = post.articles.filter((a) => a.category === "international");

  // Find prev/next posts for navigation
  const allDates = getAllPostDates();
  const currentIndex = allDates.indexOf(date);
  const newerDate = currentIndex > 0 ? allDates[currentIndex - 1] : null;
  const olderDate = currentIndex < allDates.length - 1 ? allDates[currentIndex + 1] : null;

  return (
    <div className="max-w-[1200px] mx-auto px-5">
      <WeeklyHeader
        weekDate={post.weekDate}
        title={post.title}
        description={post.description}
        articleCount={post.articleCount}
      />

      {domestic.length > 0 && (
        <section>
          <SectionDivider title="국내 Domestic" count={domestic.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {domestic.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {international.length > 0 && (
        <section>
          <SectionDivider title="해외 International" count={international.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {international.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

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
