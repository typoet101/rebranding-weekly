import KakaoChannelButton from "./KakaoChannelButton";

export default function SubscribeBanner() {
  return (
    <section className="my-10 md:my-14">
      <div
        className="rounded-sm px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ background: "linear-gradient(135deg, #FFF8D6 0%, #FFE57E 100%)" }}
      >
        <div className="text-center md:text-left">
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-[#5B4A00] mb-2">
            Subscribe
          </p>
          <h3 className="text-[1.15rem] md:text-[1.4rem] font-serif font-bold text-[#191600] leading-snug mb-1.5">
            매주 월요일, 카카오로 큐레이션 받아보기
          </h3>
          <p className="text-[13px] md:text-[14px] text-[#3a3300] leading-relaxed">
            놓치기 쉬운 국내·해외 리브랜딩 소식을 한 번에. 친구추가만 하면 끝.
          </p>
        </div>

        <KakaoChannelButton variant="pill" className="shrink-0" />
      </div>
    </section>
  );
}
