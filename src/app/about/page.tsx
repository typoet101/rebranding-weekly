import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Rebranding Weekly에 대해 알아보세요.",
};

export default function AboutPage() {
  return (
    <div className="container-content py-16">
      <h1 className="text-display font-serif font-bold text-center mb-4">
        About
      </h1>
      <p className="text-body text-secondary text-center mb-16 max-w-lg mx-auto">
        매주 월요일, 국내외 리브랜딩 뉴스를 한눈에.
      </p>

      <div className="space-y-12 max-w-prose mx-auto">
        {/* What */}
        <section>
          <h2 className="text-h2 font-serif font-bold mb-4">What is this?</h2>
          <p className="text-body text-secondary">
            Rebranding Weekly는 매주 월요일 아침, 국내와 해외의 리브랜딩 소식을
            자동으로 수집하고 AI가 요약하여 제공하는 큐레이션 블로그입니다.
            CI/BI 변경, 로고 리뉴얼, 브랜드 아이덴티티 혁신 등 브랜딩 업계의
            주요 뉴스를 한곳에서 확인할 수 있습니다.
          </p>
        </section>

        {/* How */}
        <section>
          <h2 className="text-h2 font-serif font-bold mb-4">How it works</h2>
          <ol className="text-body text-secondary space-y-3 list-decimal list-inside">
            <li>
              Google News, Naver News, Brand New 등 다양한 소스에서 리브랜딩
              관련 키워드로 뉴스를 자동 수집합니다.
            </li>
            <li>
              중복 기사를 제거하고, 실제 리브랜딩 관련 기사만 필터링합니다.
            </li>
            <li>
              Claude AI가 각 기사를 읽고 핵심 내용을 2-3문장으로 요약합니다.
            </li>
            <li>
              국내/해외로 분류하여 매거진 형태의 주간 포스트로 발행합니다.
            </li>
          </ol>
        </section>

        {/* Sources */}
        <section>
          <h2 className="text-h2 font-serif font-bold mb-4">Sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Google News", url: "https://news.google.com", desc: "한국어/영어 뉴스" },
              { name: "Naver News", url: "https://news.naver.com", desc: "국내 뉴스" },
              { name: "Brand New", url: "https://www.underconsideration.com/brandnew/", desc: "글로벌 브랜딩 뉴스" },
              { name: "It's Nice That", url: "https://www.itsnicethat.com", desc: "디자인 & 크리에이티브" },
            ].map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-border rounded hover:border-primary no-underline hover:no-underline transition-colors"
              >
                <p className="text-body font-semibold text-primary">{source.name}</p>
                <p className="text-small text-muted">{source.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t border-border pt-12">
          <h2 className="text-h2 font-serif font-bold mb-4">Disclaimer</h2>
          <p className="text-small text-muted leading-relaxed">
            이 사이트에 게시된 요약은 AI(Claude)에 의해 자동 생성되며,
            원문의 정확한 의미를 완벽히 반영하지 못할 수 있습니다.
            모든 기사의 저작권은 해당 매체에 있으며,
            원문 링크를 통해 전체 기사를 확인하시길 권장합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
