import { NextResponse, type NextRequest } from "next/server";
import { rollCycles } from "@/lib/cycle-service.ts";
import { secretMatches } from "@/lib/auth.ts";

/**
 * Nightly: open voting three days out, close the cycle on the 1st and the
 * 15th, and start the next one.
 *
 * Idempotent, so a retry or a double fire is harmless. Vercel Cron sends the
 * secret as a bearer token; the header form is there for anything else.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer /i, "") ??
    request.headers.get("x-cron-secret");
  if (!secretMatches(provided, expected)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const result = await rollCycles();
  return NextResponse.json(result);
}
