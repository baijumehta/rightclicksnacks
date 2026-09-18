/**
 * The app's own origin, needed for the OAuth redirect URI -- which has to
 * match what is registered in Entra exactly.
 */
export function appBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Vercel sets this for preview deployments, where the hostname is generated.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const redirectUri = () => `${appBaseUrl()}/api/auth/callback`;
