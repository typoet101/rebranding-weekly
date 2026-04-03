"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* Desktop: nav at top, title centered below */}
      <div className="max-w-[1400px] mx-auto px-4 hidden md:flex flex-col h-40">
        {/* Nav — top row, left/right edges */}
        <div className="flex items-center justify-between pt-3">
          <NavLink href="/archive">Archive</NavLink>
          <NavLink href="/about">About</NavLink>
        </div>
        {/* Title + Curated by BRIK — vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Link href="/" className="no-underline hover:no-underline">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-primary">
              Rebranding Weekly
            </h1>
          </Link>
          <a
            href="https://brik.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 text-xs text-gray-400 no-underline hover:text-gray-600 transition-colors tracking-widest uppercase"
          >
            Curated by BRIK
          </a>
        </div>
      </div>

      {/* Mobile: title centered, hamburger right */}
      <div className="md:hidden flex flex-col items-center justify-center relative h-24 px-5">
        <Link href="/" className="no-underline hover:no-underline">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-primary">
            Rebranding Weekly
          </h1>
        </Link>
        <a
          href="https://brik.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[10px] text-gray-400 no-underline hover:text-gray-600 transition-colors tracking-widest uppercase"
        >
          Curated by BRIK
        </a>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 no-underline absolute right-5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-primary mb-1.5 transition-transform" />
          <span className="block w-5 h-0.5 bg-primary mb-1.5" />
          <span className="block w-5 h-0.5 bg-primary" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-5 py-4 space-y-3">
          <MobileNavLink href="/archive" onClick={() => setMenuOpen(false)}>Archive</MobileNavLink>
          <MobileNavLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileNavLink>
        </nav>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-small text-secondary no-underline hover:text-primary hover:no-underline transition-colors uppercase tracking-widest"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block text-body text-primary no-underline hover:no-underline"
    >
      {children}
    </Link>
  );
}
