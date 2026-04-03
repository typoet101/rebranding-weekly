/** Industry category options for article tagging */
export const INDUSTRIES = [
  "식음료",
  "뷰티·패션",
  "IT·테크",
  "금융·보험",
  "유통·리테일",
  "자동차",
  "엔터·미디어",
  "공공·기관",
  "스포츠",
  "건설·부동산",
  "제약·헬스",
  "교육",
  "기타",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
