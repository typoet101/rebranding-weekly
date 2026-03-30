export default function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-block text-caption text-muted bg-surface border border-border rounded-full px-3 py-0.5 no-underline">
      {source}
    </span>
  );
}
