import { NextResponse, type NextRequest } from "next/server";

// TEMPORARY DIAGNOSTIC -- remove once the deployment is confirmed working.
// Reports only whether a variable is present and how long it is. Never a value.
const KEYS = [
  "DATABASE_URL", "ENTRA_TENANT_ID", "ENTRA_CLIENT_ID", "ENTRA_CLIENT_SECRET",
  "ALLOWED_EMAIL_DOMAINS", "APP_BASE_URL", "OFFICE_TIMEZONE", "CRON_SECRET",
  "VERCEL_ENV", "VERCEL_TARGET_ENV", "VERCEL_PROJECT_PRODUCTION_URL",
];

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("k") !== "tmp-9f3a2c") {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }
  const seen: Record<string, string> = {};
  for (const key of KEYS) {
    const value = process.env[key];
    seen[key] =
      value === undefined ? "ABSENT" : value === "" ? "EMPTY" : `${value.length} chars`;
  }
  return NextResponse.json({
    seen,
    totalEnvKeys: Object.keys(process.env).length,
    entraKeysPresent: Object.keys(process.env).filter((k) => k.startsWith("ENTRA")),
  });
}
