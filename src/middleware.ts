import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "branding.brik.co.kr";

/**
 * Permanently redirect requests on the legacy *.vercel.app hostname to the
 * canonical custom domain. Page paths and query strings are preserved.
 *
 * /api/* is intentionally exempted so internal Vercel calls (cron jobs,
 * webhooks) and any direct API integrations continue to work on either
 * hostname without a redirect dance.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (host === CANONICAL_HOST) return NextResponse.next();

  if (host.endsWith(".vercel.app")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths EXCEPT:
    //   /api/*           (API endpoints — let them respond on either host)
    //   /_next/*         (Next.js internal)
    //   /favicon.ico
    //   any file with an extension (.png, .jpg, .css, etc.)
    "/((?!api|_next|favicon.ico|.*\\..*).*)",
  ],
};
