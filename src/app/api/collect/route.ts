import { NextRequest, NextResponse } from "next/server";
import { collect } from "@/lib/collector/index";

/**
 * POST /api/collect
 *
 * Triggers the weekly news collection.
 * Protected by CRON_SECRET in Authorization header.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await collect();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[API] Collection failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collect — Health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Use POST to trigger collection.",
  });
}
