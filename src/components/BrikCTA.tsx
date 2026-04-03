export default function BrikCTA() {
  return (
    <a
      href="https://brik.co.kr"
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline hover:no-underline my-12"
    >
      <div className="border border-gray-200 rounded-lg px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gray-400 transition-colors bg-gray-50">
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-500 mb-1">
            리브랜딩을 고민 중이신가요?
          </p>
          <p className="text-base font-semibold text-gray-800">
            BRIK과 함께 브랜드의 새로운 시작을 만들어보세요
          </p>
        </div>
        <div className="shrink-0 text-sm font-medium text-gray-500 border border-gray-300 rounded-full px-5 py-2 hover:bg-white transition-colors">
          BRIK.co.kr &rarr;
        </div>
      </div>
    </a>
  );
}
