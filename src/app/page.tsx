import { getLatestPost } from "@/lib/content";
import WeeklyHeader from "@/components/WeeklyHeader";
import PostView from "@/components/PostView";
import Link from "next/link";

export default function HomePage() {
  const post = getLatestPost();

  if (!post) {
    return (
      <div className="container-content py-32 text-center">
        <h1 className="text-[6.5rem] font-serif font-black uppercase mb-4 text-center">
          Rebranding Weekly
        </h1>
        <p className="text-body text-secondary mb-8">
          매주 월요일, 국내외 리브랜딩 뉴스를 AI가 큐레이션합니다.
        </p>
        <p className="text-small text-muted">
          첫 번째 포스트가 곧 발행됩니다. Coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <WeeklyHeader
        weekDate={post.weekDate}
        title={post.title}
        description={post.description}
        articleCount={post.articleCount}
      />

      <PostView weekDate={post.weekDate} initialArticles={post.articles} />

      {/* Archive Link */}
      <div className="text-center py-16 border-t border-border">
        <Link
          href="/archive"
          className="text-small text-muted hover:text-primary uppercase tracking-widest no-underline hover:no-underline transition-colors"
        >
          View all issues &rarr;
        </Link>
      </div>
    </div>
  );
}
