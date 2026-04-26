"use client";

import { useState } from "react";

export default function AdminBar({
  onToggle,
  isAdmin,
  pendingCount = 0,
}: {
  onToggle: (isAdmin: boolean) => void;
  isAdmin: boolean;
  pendingCount?: number;
}) {
  const [showInput, setShowInput] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Cache password for follow-up admin API calls (star/delete persistence)
        try {
          sessionStorage.setItem("rw_admin_pw", password);
        } catch {}
        onToggle(true);
        setShowInput(false);
        setPassword("");
      } else {
        setError("비밀번호가 틀렸습니다");
      }
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (isAdmin) {
    const hasChanges = pendingCount > 0;
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm">
        <span>🔧 관리자 모드</span>
        {hasChanges && (
          <span
            aria-label="변경 건수"
            className="bg-white/25 text-white rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
          >
            {pendingCount}건 변경
          </span>
        )}
        <button
          onClick={() => onToggle(false)}
          className={`ml-1 rounded-full px-3 py-0.5 text-xs font-bold no-underline hover:no-underline transition-colors ${
            hasChanges
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-white text-red-600"
          }`}
        >
          {hasChanges ? "✓ 완료" : "완료"}
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-full shadow-lg">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") {
                setShowInput(false);
                setPassword("");
                setError("");
              }
            }}
            placeholder="비밀번호"
            className="text-sm border border-border rounded px-2 py-1 w-32 outline-none"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-xs font-bold bg-primary text-white rounded px-3 py-1 no-underline hover:no-underline disabled:opacity-50"
          >
            {loading ? "..." : "확인"}
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setPassword("");
              setError("");
            }}
            className="text-xs text-muted no-underline hover:no-underline"
          >
            취소
          </button>
        </div>
        {error && (
          <span className="text-xs text-red-500 bg-white px-3 py-1 rounded-full shadow-md">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="fixed bottom-4 right-4 z-50 bg-white border border-border rounded-full w-10 h-10 flex items-center justify-center shadow-md text-muted hover:text-primary transition-colors no-underline hover:no-underline"
      title="관리자 모드"
    >
      ⚙️
    </button>
  );
}
