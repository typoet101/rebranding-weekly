export default function SectionDivider({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-4 my-10">
      <div className="h-px bg-primary flex-1" />
      <h2 className="text-h3 font-serif font-bold whitespace-nowrap">
        {title}
        <span className="text-small text-muted font-sans font-normal ml-2">
          ({count})
        </span>
      </h2>
      <div className="h-px bg-primary flex-1" />
    </div>
  );
}
