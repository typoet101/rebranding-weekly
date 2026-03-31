export default function SectionDivider({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-4 mb-8 mt-4">
      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.2em] whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px bg-border flex-1" />
      <span className="text-xs text-muted font-mono">
        {count}
      </span>
    </div>
  );
}
