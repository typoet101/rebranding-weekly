import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth
 * Body: { password }
 * Returns 200 { ok: true } on match, 401 on mismatch.
 * Read-only — no filesystem writes.
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.CRON_SECRET || "admin";

    if (password === adminPassword) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
