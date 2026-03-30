import { getWeekLabel } from "@/lib/dates";

export default function WeeklyHeader({
  weekDate,
  title,
  description,
  articleCount,
}: {
  weekDate: string;
  title: string;
  description: string;
  articleCount: number;
}) {
  return (
    <div className="text-center py-16 border-b border-border mb-10">
      <p className="text-caption text-muted uppercase tracking-[0.2em] mb-4">
        Week of {weekDate}
      </p>
      <p className="text-small text-secondary mb-3">
        {getWeekLabel(weekDate)}
      </p>
      <h1 className="text-display font-serif font-bold mb-4 px-4">
        {title}
      </h1>
      <p className="text-body text-secondary max-w-lg mx-auto mb-4">
        {description}
      </p>
      <p className="text-caption text-muted">
        {articleCount} articles curated this week
      </p>
    </div>
  );
}
