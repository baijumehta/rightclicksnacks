import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * How this app authenticates to the Claude API.
 *
 * Two supported ways, in order of preference:
 *
 * 1. Workload identity federation. Vercel mints a short-lived OIDC token for
 *    every deployment; Anthropic trades it for an access token. No long-lived
 *    secret is stored anywhere, nothing to rotate, and access is revoked by
 *    archiving the federation rule.
 * 2. A plain API key, for local work or if federation is not set up.
 *
 * The SDK activates federation on its own once the four ANTHROPIC_* variables
 * are present, but it looks for the identity token under its own name, and
 * Vercel publishes it as VERCEL_OIDC_TOKEN -- so the bridge below is the only
 * glue needed.
 */

export type AuthMode = "federation" | "api-key" | "none";

const FEDERATION_VARS = [
  "ANTHROPIC_FEDERATION_RULE_ID",
  "ANTHROPIC_ORGANIZATION_ID",
  "ANTHROPIC_SERVICE_ACCOUNT_ID",
] as const;

function hasFederationConfig(): boolean {
  return FEDERATION_VARS.every((name) => Boolean(process.env[name]?.trim()));
}

/**
 * Give the SDK the identity token under the name it expects.
 *
 * Vercel refreshes VERCEL_OIDC_TOKEN per deployment, so read it per call
 * rather than caching a client -- a cached one would hold a token that
 * eventually expires.
 */
function bridgeIdentityToken(): boolean {
  if (process.env.ANTHROPIC_IDENTITY_TOKEN?.trim()) return true;
  if (process.env.ANTHROPIC_IDENTITY_TOKEN_FILE?.trim()) return true;

  const vercelToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!vercelToken) return false;
  process.env.ANTHROPIC_IDENTITY_TOKEN = vercelToken;
  return true;
}

export function authMode(): AuthMode {
  /*
   * An API key -- even an EMPTY one -- outranks federation inside the SDK.
   * A blank ANTHROPIC_API_KEY left behind in the environment is therefore not
   * harmless: it silently disables federation. Treat blank as absent and
   * delete it from the environment so the SDK cannot see it.
   */
  const key = process.env.ANTHROPIC_API_KEY;
  if (key !== undefined && !key.trim()) delete process.env.ANTHROPIC_API_KEY;
  if (process.env.ANTHROPIC_AUTH_TOKEN !== undefined && !process.env.ANTHROPIC_AUTH_TOKEN.trim()) {
    delete process.env.ANTHROPIC_AUTH_TOKEN;
  }

  if (hasFederationConfig() && bridgeIdentityToken()) return "federation";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "api-key";
  return "none";
}

/** True when photo import can run at all. */
export const claudeConfigured = () => authMode() !== "none";

/**
 * A client, or null when nothing is configured. Built per call: the federated
 * identity token is short-lived, so a long-lived cached client would go stale.
 */
export function claudeClient(): Anthropic | null {
  const mode = authMode();
  if (mode === "none") return null;
  // Zero-arg on purpose -- the SDK resolves either credential from the
  // environment, and passing one explicitly would defeat federation.
  return new Anthropic();
}

/** For the admin screen, so it is obvious which credential is in play. */
export function describeAuth(): string {
  switch (authMode()) {
    case "federation":
      return "Workload identity federation (no stored key)";
    case "api-key":
      return "API key";
    default:
      return "Not configured";
  }
}
