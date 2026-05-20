import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const checks = { database: "unknown" };
  let ok = true;

  try {
    await db.$runCommandRaw({ ping: 1 });
    checks.database = "ok";
  } catch (err) {
    checks.database = "error";
    ok = false;
    logger.error("Health check — database ping failed", { error: err.message });
  }

  return NextResponse.json(
    { status: ok ? "ok" : "degraded", checks },
    { status: ok ? 200 : 503 },
  );
}
