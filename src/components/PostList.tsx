import Link from "next/link";
import type { PostMeta } from "@/lib/types";
import { getWeekLabel } from "@/lib/dates";

export default function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-body text-muted text-center py-16">
        No posts yet. Check back next Monday!
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <Link
          key={post.weekDate}
          href={`/posts/${post.weekDate}`}
          className="group block py-6 border-b border-border no-underline hover:no-underline transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-caption text-muted font-mono mb-1">
                {getWeekLabel(post.weekDate)}
              </p>
              <h3 className="text-h3 font-serif font-semibold text-primary group-hover:underline group-hover:decoration-primary truncate">
                {post.title}
              </h3>
              <p className="text-small text-secondary mt-1 line-clamp-1">
                {post.description}
              </p>
            </div>

            <div className="flex items-center gap-3 text-caption text-muted whitespace-nowrap sm:ml-6">
              <span>국내 {post.domesticCount}</span>
              <span>&middot;</span>
              <span>해외 {post.internationalCount}</span>
              <span className="text-primary group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
