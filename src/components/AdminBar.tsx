"use client";

import { useState } from "react";

export default function AdminBar({
  onToggle,
  isAdmin,
}: {
  onToggle: (isAdmin: boolean) => void;
  isAdmin: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const [password, setPassword] = useState("");

  if (isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm">
        <span>🔧 관리자 모드</span>
        <button
          onClick={() => onToggle(false)}
          className="ml-2 bg-white text-red-600 rounded-full px-3 py-0.5 text-xs font-bold no-underline hover:no-underline"
        >
          종료
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-full shadow-lg">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onToggle(true);
              // Store password for API calls
              sessionStorage.setItem("admin_pw", password);
            }
            if (e.key === "Escape") {
              setShowInput(false);
              setPassword("");
            }
          }}
          placeholder="비밀번호"
          className="text-sm border border-border rounded px-2 py-1 w-32 outline-none"
          autoFocus
        />
        <button
          onClick={() => {
            onToggle(true);
            sessionStorage.setItem("admin_pw", password);
          }}
          className="text-xs font-bold bg-primary text-white rounded px-3 py-1 no-underline hover:no-underline"
        >
          확인
        </button>
        <button
          onClick={() => { setShowInput(false); setPassword(""); }}
          className="text-xs text-muted no-underline hover:no-underline"
        >
          취소
        </button>
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
