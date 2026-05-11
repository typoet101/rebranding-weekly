/**
 * Kakao Channel and Share constants.
 *
 * Channel: BRIK Rebranding Weekly — http://pf.kakao.com/_SyPJj
 *
 * The "add friend" deep-link goes through pf.kakao.com on web; on mobile
 * Kakao intercepts and opens the KakaoTalk app directly.
 */
export const KAKAO_CHANNEL_ID = "_SyPJj";
export const KAKAO_CHANNEL_HOME = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}`;
export const KAKAO_CHANNEL_ADD = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}/friend`;

/** Optional Kakao JS SDK app key (from https://developers.kakao.com/) */
export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

/**
 * Email newsletter (Maily). Long-form, biweekly branding analysis essays.
 */
export const MAILY_NEWSLETTER_URL = "https://maily.so/brik";
