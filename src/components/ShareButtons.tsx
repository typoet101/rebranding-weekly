"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { KAKAO_JS_KEY } from "@/lib/kakao";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share?: {
        sendDefault: (opts: object) => void;
      };
    };
  }
}

interface Props {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export default function ShareButtons({ title, description, url, imageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  function handleNativeShare() {
    navigator
      .share({ title, text: description, url })
      .catch(() => {
        // user cancelled or share unsupported — silent
      });
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {
        // clipboard blocked — fall back to prompt
        window.prompt("이 링크를 복사하세요", url);
      });
  }

  function handleKakaoShare() {
    if (typeof window === "undefined" || !window.Kakao) {
      window.open(url, "_blank");
      return;
    }
    if (!window.Kakao.isInitialized() && KAKAO_JS_KEY) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
    if (!window.Kakao.Share) {
      window.open(url, "_blank");
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: imageUrl || "",
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "전체 보기",
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }

  return (
    <>
      {KAKAO_JS_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Kakao share — only if SDK key configured */}
        {KAKAO_JS_KEY && (
          <button
            onClick={handleKakaoShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium no-underline hover:no-underline transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "#FEE500", color: "#191600" }}
          >
            <KakaoMark />
            카카오톡 공유
          </button>
        )}

        {/* Native share (mobile) */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border border-border bg-white text-secondary hover:text-primary hover:border-primary transition-colors no-underline hover:no-underline"
          >
            <ShareIcon />
            공유
          </button>
        )}

        {/* Copy link */}
        <button
          onClick={handleCopy}
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border border-border bg-white text-secondary hover:text-primary hover:border-primary transition-colors no-underline hover:no-underline"
        >
          <LinkIcon />
          {copied ? "복사됨!" : "링크 복사"}
        </button>
      </div>
    </>
  );
}

function KakaoMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.66 6.74L5.4 21.4a.5.5 0 0 0 .76.55l4.46-2.96c.45.05.91.07 1.38.07 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
