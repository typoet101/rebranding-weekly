import KakaoChannelButton from "./KakaoChannelButton";
import NewsletterButton from "./NewsletterButton";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-20">
      <div className="container-content py-14">
        {/* Subscribe — dual channel */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-muted mb-3">
            Subscribe
          </p>
          <h3 className="text-[1.1rem] md:text-[1.3rem] font-sans font-bold text-primary mb-2">
            취향에 맞는 채널로 받아보세요
          </h3>
          <p className="text-[13px] text-secondary leading-relaxed mb-6">
            매주 자동 큐레이션은 카카오 채널로, 격주 깊이 있는 분석은 이메일로.
            둘 다 구독해도 좋아요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <KakaoChannelButton variant="pill" />
              <span className="text-[11px] text-muted">매주 · 큐레이션</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <NewsletterButton variant="pill" />
              <span className="text-[11px] text-muted">격주 · 깊이 분석</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border space-y-2 text-center">
          <p className="text-caption text-muted uppercase tracking-widest">
            Powered by Claude AI &middot; Curated weekly
          </p>
          <p className="text-caption text-muted">
            &copy; {year} Rebranding Weekly. All article copyrights belong to their respective publishers.
          </p>
        </div>
      </div>
    </footer>
  );
}
