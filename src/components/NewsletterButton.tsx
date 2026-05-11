import { MAILY_NEWSLETTER_URL } from "@/lib/kakao";

type Variant = "icon" | "compact" | "pill";

export default function NewsletterButton({
  variant = "compact",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const label = "이메일 뉴스레터";

  if (variant === "icon") {
    return (
      <a
        href={MAILY_NEWSLETTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full no-underline hover:no-underline transition-transform hover:scale-110 bg-primary text-white ${className}`}
      >
        <MailMark />
      </a>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={MAILY_NEWSLETTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm no-underline hover:no-underline transition-transform hover:scale-[1.02] shadow-sm bg-primary text-white ${className}`}
      >
        <MailMark />
        {label}
      </a>
    );
  }

  // compact
  return (
    <a
      href={MAILY_NEWSLETTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium no-underline hover:no-underline transition-transform hover:scale-[1.03] bg-primary text-white ${className}`}
    >
      <MailMark size={12} />
      {label}
    </a>
  );
}

function MailMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
