import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Microsoft Entra ID sign-in, done directly against the OIDC endpoints.
 *
 * This is authorization-code + PKCE, which is the flow Microsoft recommends
 * for a confidential web client, and it is about a hundred lines -- less than
 * the configuration a library would need, and with nothing hidden.
 */

export interface EntraConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface EntraProfile {
  /** The immutable object id. Emails change; this does not. */
  oid: string;
  email: string;
  name: string;
  /** The tenant the token was issued by, checked against our own. */
  tid: string;
}

export function entraConfig(): EntraConfig | null {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;
  return { tenantId, clientId, clientSecret };
}

const authority = (tenantId: string) =>
  `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}`;

// The key set is cached and refreshed by jose itself, so build it once per
// process rather than per sign-in -- otherwise every login refetches the JWKS.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(tenantId: string) {
  const url = `${authority(tenantId)}/discovery/v2.0/keys`;
  let set = jwksCache.get(url);
  if (!set) {
    set = createRemoteJWKSet(new URL(url));
    jwksCache.set(url, set);
  }
  return set;
}

/* ------------------------------------------------------------------ */
/* PKCE                                                               */
/* ------------------------------------------------------------------ */

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export const randomToken = () => randomBytes(32).toString("base64url");

/* ------------------------------------------------------------------ */
/* Step 1: send the browser to Microsoft                              */
/* ------------------------------------------------------------------ */

export function authorizeUrl(
  config: EntraConfig,
  params: { redirectUri: string; state: string; nonce: string; challenge: string },
): string {
  const url = new URL(`${authority(config.tenantId)}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/* ------------------------------------------------------------------ */
/* Step 2: swap the code for an id token                              */
/* ------------------------------------------------------------------ */

export async function exchangeCode(
  config: EntraConfig,
  params: { code: string; redirectUri: string; verifier: string },
): Promise<string> {
  const response = await fetch(`${authority(config.tenantId)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.verifier,
      scope: "openid profile email",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Entra token exchange failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) throw new Error("Entra returned no id_token");
  return body.id_token;
}

/* ------------------------------------------------------------------ */
/* Step 3: verify it and read who signed in                           */
/* ------------------------------------------------------------------ */

export async function verifyIdToken(
  config: EntraConfig,
  idToken: string,
  expectedNonce: string,
): Promise<EntraProfile> {
  const jwks = jwksFor(config.tenantId);
  const { payload: claims } = await jwtVerify(idToken, jwks, {
    audience: config.clientId,
    issuer: [
      `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
      // Entra issues the `sts.windows.net` form for some tenant setups.
      `https://sts.windows.net/${config.tenantId}/`,
    ],
  });

  if (claims.nonce !== expectedNonce) {
    throw new Error("Nonce mismatch -- the sign-in did not start here");
  }
  if (typeof claims.tid === "string" && claims.tid !== config.tenantId) {
    throw new Error("Token came from a different tenant");
  }

  const email =
    (typeof claims.email === "string" && claims.email) ||
    (typeof claims.preferred_username === "string" && claims.preferred_username) ||
    "";
  if (!email.includes("@")) throw new Error("Entra returned no usable email claim");

  return {
    oid: String(claims.oid ?? claims.sub),
    email: email.trim().toLowerCase(),
    name:
      (typeof claims.name === "string" && claims.name.trim()) ||
      email.split("@")[0],
    tid: String(claims.tid ?? config.tenantId),
  };
}
