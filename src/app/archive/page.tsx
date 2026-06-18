import { getAllPostMetas } from "@/lib/content";
import { getMonthLabel } from "@/lib/dates";
import PostList from "@/components/PostList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive",
  description: "Rebranding Weekly 아카이브 - 모든 주간 포스트를 확인하세요.",
};

export default function ArchivePage() {
  const posts = getAllPostMetas();

  // Group by month
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const month = getMonthLabel(post.weekDate);
    if (!acc[month]) acc[month] = [];
    acc[month].push(post);
    return acc;
  }, {});

  const months = Object.keys(grouped);

  return (
    <div className="container-wide py-16">
      <h1 className="text-display font-serif font-bold text-center mb-4">
        Archive
      </h1>
      <p className="text-body text-secondary text-center mb-16">
        지난 주간 리브랜딩 뉴스를 모아봅니다.
      </p>

      {months.length === 0 ? (
        <p className="text-body text-muted text-center py-16">
          No posts yet. The first issue arrives next Monday!
        </p>
      ) : (
        <div className="max-w-content mx-auto space-y-12">
          {months.map((month) => (
            <section key={month}>
              <h2 className="text-h2 font-serif font-bold mb-4 pb-2 border-b border-primary">
                {month}
              </h2>
              <PostList posts={grouped[month]} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
