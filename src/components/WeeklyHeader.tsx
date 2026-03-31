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
    <div className="text-center pt-16 pb-12 mb-8">
      <h1 className="text-[3.5rem] sm:text-[5rem] font-serif font-black leading-[0.95] mb-6 px-4 uppercase">
        {title}
      </h1>
      <p className="text-body text-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center justify-center gap-4 text-caption text-muted uppercase tracking-[0.15em]">
        <span>{getWeekLabel(weekDate)}</span>
        <span className="w-1 h-1 rounded-full bg-muted" />
        <span>{articleCount} articles</span>
      </div>
    </div>
  );
}
