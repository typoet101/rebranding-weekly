/**
 * Get the Monday of the current week (or a given date's week).
 */
export function getMondayDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust: Sunday = 0 → offset 6, Monday = 1 → offset 0, etc.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDate(d);
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get the date range label for a work week starting on the given Monday.
 * e.g., "2026년 3월 30일 — 4월 3일"
 */
export function getWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const mMonth = monday.getMonth() + 1;
  const mDay = monday.getDate();
  const fMonth = friday.getMonth() + 1;
  const fDay = friday.getDate();
  const year = monday.getFullYear();

  if (mMonth === fMonth) {
    return `${year}년 ${mMonth}월 ${mDay}일 — ${fDay}일`;
  }
  return `${year}년 ${mMonth}월 ${mDay}일 — ${fMonth}월 ${fDay}일`;
}

/**
 * Get a human-readable English date range label.
 * e.g., "Mar 30 — Apr 3, 2026"
 */
export function getWeekLabelEn(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const mMonth = months[monday.getMonth()];
  const mDay = monday.getDate();
  const fMonth = months[friday.getMonth()];
  const fDay = friday.getDate();
  const year = friday.getFullYear();

  if (mMonth === fMonth) {
    return `${mMonth} ${mDay} — ${fDay}, ${year}`;
  }
  return `${mMonth} ${mDay} — ${fMonth} ${fDay}, ${year}`;
}

/**
 * Check if a date string is within the last N days from now.
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

/**
 * Get month-year label for grouping: "2026년 3월"
 */
export function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
