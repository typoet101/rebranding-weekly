import { getLatestPostWithOverrides } from "@/lib/content";
import FeaturedHero from "@/components/FeaturedHero";
import PostView from "@/components/PostView";
import Link from "next/link";

// Always render fresh so KV overrides (hero/starred/deleted) take effect
// without waiting for a redeploy.
export const revalidate = 0;

export default async function HomePage() {
  const post = await getLatestPostWithOverrides();

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

  // Hero image priority:
  //   1. Article explicitly chosen as hero (post.heroArticleId)
  //   2. First BRIK's Pick (starred) article that has a real OG image
  //   3. First article with a real OG image (lead news photo)
  function hasRealImage(a: { imageUrl?: string }) {
    return !!a.imageUrl && !a.imageUrl.includes("googleusercontent.com");
  }
  const explicit = post.heroArticleId
    ? post.articles.find((a) => a.id === post.heroArticleId && hasRealImage(a))
    : undefined;
  const heroArticle =
    explicit ||
    post.articles.find((a) => a.starred && hasRealImage(a)) ||
    post.articles.find(hasRealImage);
  const heroImage = heroArticle?.imageUrl;
  const heroImageFit = heroArticle?.imageFit;

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <FeaturedHero
        weekDate={post.weekDate}
        title={post.title}
        description={post.description}
        articleCount={post.articleCount}
        featuredImage={heroImage}
        imageFit={heroImageFit}
      />

      {/* Latest articles section header with "View all" upper-right */}
      <div className="flex items-baseline justify-between mt-4 mb-6">
        <h2 className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-muted">
          Latest Articles
        </h2>
        <Link
          href="/archive"
          className="text-[12px] text-secondary hover:text-primary no-underline hover:no-underline transition-colors"
        >
          View all articles →
        </Link>
      </div>

      <PostView
        weekDate={post.weekDate}
        initialArticles={post.articles}
        initialHeroId={post.heroArticleId}
      />
    </div>
  );
}
