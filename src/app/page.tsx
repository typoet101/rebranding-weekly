import { getLatestPost } from "@/lib/content";
import WeeklyHeader from "@/components/WeeklyHeader";
import SectionDivider from "@/components/SectionDivider";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";

export default function HomePage() {
  const post = getLatestPost();

  if (!post) {
    return (
      <div className="container-content py-32 text-center">
        <h1 className="text-[5rem] font-serif font-black uppercase mb-4">
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

  const domestic = post.articles.filter((a) => a.category === "domestic");
  const international = post.articles.filter((a) => a.category === "international");

  return (
    <div className="max-w-[1200px] mx-auto px-5">
      <WeeklyHeader
        weekDate={post.weekDate}
        title={post.title}
        description={post.description}
        articleCount={post.articleCount}
      />

      {/* Domestic Section */}
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

      {/* International Section */}
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
