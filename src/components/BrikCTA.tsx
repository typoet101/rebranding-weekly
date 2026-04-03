export default function BrikCTA() {
  return (
    <a
      href="https://brik.co.kr"
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline hover:no-underline my-12 group"
    >
      {/* Desktop */}
      <div
        className="hidden md:flex relative rounded-lg overflow-hidden h-[200px] items-center justify-between px-12 bg-cover bg-center"
        style={{ backgroundImage: "url('/brik-cta-desktop.jpg')" }}
      >
        <div className="relative z-10">
          <p className="text-sm text-gray-400 mb-1.5">
            리브랜딩을 고민 중이신가요?
          </p>
          <p className="text-xl font-semibold text-white">
            BRIK과 함께 브랜드의 새로운 시작을 만들어보세요
          </p>
        </div>
        <div className="relative z-10 shrink-0 text-sm font-medium text-gray-300 border border-gray-500 rounded-full px-6 py-2.5 group-hover:border-white group-hover:text-white transition-colors">
          BRIK.co.kr &rarr;
        </div>
      </div>

      {/* Mobile */}
      <div
        className="md:hidden relative rounded-lg overflow-hidden h-[140px] flex flex-col items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/brik-cta-mobile-1.jpg')" }}
      >
        <p className="relative z-10 text-xs text-gray-400 mb-1.5">
          리브랜딩을 고민 중이신가요?
        </p>
        <p className="relative z-10 text-base font-semibold text-white mb-3">
          BRIK과 함께 브랜드의 새로운 시작을 만들어보세요
        </p>
        <div className="relative z-10 text-xs font-medium text-gray-300 border border-gray-500 rounded-full px-5 py-2 group-hover:border-white group-hover:text-white transition-colors">
          BRIK.co.kr &rarr;
        </div>
      </div>
    </a>
  );
}
