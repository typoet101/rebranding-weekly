import { getWeekLabel } from "@/lib/dates";

export default function FeaturedHero({
  weekDate,
  title,
  description,
  articleCount,
  featuredImage,
  fallbackImage,
}: {
  weekDate: string;
  title: string;
  description: string;
  articleCount: number;
  featuredImage?: string;
  fallbackImage?: string;
}) {
  const heroImage = featuredImage || fallbackImage;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center pt-6 pb-8 md:pt-10 md:pb-12">
      {/* Left — text */}
      <div className="order-2 md:order-1 px-1">
        <span className="inline-block text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-muted mb-5">
          Featured
        </span>
        <h1 className="text-[1.6rem] sm:text-[2rem] md:text-[2.4rem] lg:text-[2.6rem] font-serif font-bold leading-[1.08] tracking-tight text-primary mb-6">
          {title}
        </h1>
        <p className="text-[0.95rem] sm:text-[1rem] text-secondary leading-relaxed mb-8 max-w-prose">
          {description}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted uppercase tracking-[0.18em]">
          <span>{getWeekLabel(weekDate)}</span>
          <span className="w-1 h-1 rounded-full bg-muted" />
          <span>{articleCount} articles</span>
        </div>
      </div>

      {/* Right — image */}
      <div className="order-1 md:order-2 w-full aspect-[16/9] overflow-hidden rounded-sm bg-surface">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs uppercase tracking-widest">
            No image
          </div>
        )}
      </div>
    </section>
  );
}
