import KakaoChannelButton from "./KakaoChannelButton";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-20">
      <div className="container-content py-12 text-center space-y-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-caption text-muted uppercase tracking-widest">
            매주 월요일, 큐레이션을 카카오로 받아보세요
          </p>
          <KakaoChannelButton variant="pill" />
        </div>

        <div className="pt-4 border-t border-border space-y-2">
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
