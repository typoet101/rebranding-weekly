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
 * Get the date range label for a week starting on the given Monday.
 * e.g., "2026년 3월 30일 — 4월 5일"
 */
export function getWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mMonth = monday.getMonth() + 1;
  const mDay = monday.getDate();
  const sMonth = sunday.getMonth() + 1;
  const sDay = sunday.getDate();
  const year = monday.getFullYear();

  if (mMonth === sMonth) {
    return `${year}년 ${mMonth}월 ${mDay}일 — ${sDay}일`;
  }
  return `${year}년 ${mMonth}월 ${mDay}일 — ${sMonth}월 ${sDay}일`;
}

/**
 * Get a human-readable English date range label.
 * e.g., "Mar 30 — Apr 5, 2026"
 */
export function getWeekLabelEn(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const mMonth = months[monday.getMonth()];
  const mDay = monday.getDate();
  const sMonth = months[sunday.getMonth()];
  const sDay = sunday.getDate();
  const year = sunday.getFullYear();

  if (mMonth === sMonth) {
    return `${mMonth} ${mDay} — ${sDay}, ${year}`;
  }
  return `${mMonth} ${mDay} — ${sMonth} ${sDay}, ${year}`;
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
