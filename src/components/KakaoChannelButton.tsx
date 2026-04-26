import { KAKAO_CHANNEL_ADD } from "@/lib/kakao";

type Variant = "icon" | "compact" | "pill";

const KAKAO_YELLOW = "#FEE500";
const KAKAO_BROWN = "#191600";

export default function KakaoChannelButton({
  variant = "compact",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const label = "카카오 채널 추가";

  if (variant === "icon") {
    return (
      <a
        href={KAKAO_CHANNEL_ADD}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full no-underline hover:no-underline transition-transform hover:scale-110 ${className}`}
        style={{ backgroundColor: KAKAO_YELLOW, color: KAKAO_BROWN }}
      >
        <KakaoMark />
      </a>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={KAKAO_CHANNEL_ADD}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm no-underline hover:no-underline transition-transform hover:scale-[1.02] shadow-sm ${className}`}
        style={{ backgroundColor: KAKAO_YELLOW, color: KAKAO_BROWN }}
      >
        <KakaoMark />
        {label}
      </a>
    );
  }

  // compact
  return (
    <a
      href={KAKAO_CHANNEL_ADD}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium no-underline hover:no-underline transition-transform hover:scale-[1.03] ${className}`}
      style={{ backgroundColor: KAKAO_YELLOW, color: KAKAO_BROWN }}
    >
      <KakaoMark size={12} />
      {label}
    </a>
  );
}

function KakaoMark({ size = 14 }: { size?: number }) {
  // Simplified KakaoTalk speech-bubble glyph
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.66 6.74L5.4 21.4a.5.5 0 0 0 .76.55l4.46-2.96c.45.05.91.07 1.38.07 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
    </svg>
  );
}
