import { NextResponse, type NextRequest } from "next/server";
import { completeSignIn } from "@/lib/auth.ts";
import { appBaseUrl } from "@/lib/base-url.ts";

/** Where Entra sends the browser back to after a sign-in. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const base = appBaseUrl();

  // Entra reports its own failures here too -- a declined consent prompt, say.
  const entraError = params.get("error_description") ?? params.get("error");
  if (entraError) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(entraError.slice(0, 200))}`,
    );
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${base}/login?error=missing_code`);
  }

  try {
    const next = await completeSignIn(code, state);
    return NextResponse.redirect(`${base}${next.startsWith("/") ? next : "/"}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "sign_in_failed";
    const known = ["NOT_INVITED", "ACCOUNT_DISABLED", "STALE_SIGN_IN", "ENTRA_NOT_CONFIGURED"];
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(known.includes(reason) ? reason : "sign_in_failed")}`,
    );
  }
}
