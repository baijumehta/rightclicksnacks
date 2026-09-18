import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { authFlows, sessions, users, type User } from "@/db/schema.ts";
import {
  authorizeUrl, createPkce, entraConfig, exchangeCode, randomToken, verifyIdToken,
} from "./entra.ts";
import { redirectUri } from "./base-url.ts";

const SESSION_COOKIE = "snacks_session";
const SESSION_DAYS = 45;
const FLOW_MINUTES = 15;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/* ------------------------------------------------------------------ */
/* Who is allowed in                                                   */
/* ------------------------------------------------------------------ */

/**
 * Domains that may sign in and get an account created on the spot. Anyone
 * outside them has to be added to `users` by an admin first, which keeps a
 * guest in the tenant from wandering into the ballot.
 */
function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function domainAllowed(email: string): boolean {
  const domains = allowedDomains();
  if (domains.length === 0) return false;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domains.includes(domain);
}

/* ------------------------------------------------------------------ */
/* Sign-in flow                                                        */
/* ------------------------------------------------------------------ */

/** Start a sign-in: returns the Microsoft URL to send the browser to. */
export async function beginSignIn(redirectTo?: string): Promise<string> {
  const config = entraConfig();
  if (!config) throw new Error("ENTRA_NOT_CONFIGURED");

  const state = randomToken();
  const nonce = randomToken();
  const { verifier, challenge } = createPkce();

  await db.insert(authFlows).values({
    state,
    codeVerifier: verifier,
    nonce,
    redirectTo: redirectTo ?? null,
    expiresAt: new Date(Date.now() + FLOW_MINUTES * 60_000),
  });

  // Opportunistic sweep; there is no cron for this and the table stays tiny.
  await db.delete(authFlows).where(lt(authFlows.expiresAt, new Date()));

  return authorizeUrl(config, {
    redirectUri: redirectUri(),
    state,
    nonce,
    challenge,
  });
}

/**
 * Finish a sign-in. Returns where to send the browser next.
 * Throws if the state is unknown, replayed, expired, or the person is not
 * allowed in.
 */
export async function completeSignIn(
  code: string,
  state: string,
): Promise<string> {
  const config = entraConfig();
  if (!config) throw new Error("ENTRA_NOT_CONFIGURED");

  const flow = await db.query.authFlows.findFirst({
    where: eq(authFlows.state, state),
  });
  // Delete first: a state is good for exactly one callback, so a replayed
  // link cannot mint a second session.
  if (flow) await db.delete(authFlows).where(eq(authFlows.state, state));
  if (!flow || flow.expiresAt < new Date()) throw new Error("STALE_SIGN_IN");

  const idToken = await exchangeCode(config, {
    code,
    redirectUri: redirectUri(),
    verifier: flow.codeVerifier,
  });
  const profile = await verifyIdToken(config, idToken, flow.nonce);

  const user = await upsertUser(profile.oid, profile.email, profile.name);
  await startSession(user.id);
  return flow.redirectTo ?? "/";
}

/**
 * Match on the Entra object id first, then fall back to email so someone
 * seeded by an admin gets linked to their Microsoft account on first login
 * rather than ending up with a duplicate row.
 */
async function upsertUser(oid: string, email: string, name: string): Promise<User> {
  const byOid = await db.query.users.findFirst({ where: eq(users.entraOid, oid) });
  if (byOid) {
    if (!byOid.isActive) throw new Error("ACCOUNT_DISABLED");
    if (byOid.email !== email || byOid.name !== name) {
      await db.update(users).set({ email, name }).where(eq(users.id, byOid.id));
    }
    return { ...byOid, email, name };
  }

  const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (byEmail) {
    if (!byEmail.isActive) throw new Error("ACCOUNT_DISABLED");
    await db.update(users).set({ entraOid: oid, name }).where(eq(users.id, byEmail.id));
    return { ...byEmail, entraOid: oid, name };
  }

  if (!domainAllowed(email)) throw new Error("NOT_INVITED");

  // First person through the door runs the place, so there is always somebody
  // who can reach the admin screen on a fresh install.
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  const [created] = await db
    .insert(users)
    .values({ email, name, entraOid: oid, isAdmin: !existing })
    .returning();
  return created;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(sessions).values({ userId, tokenHash: sha256(token), expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in person, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // The layout calls this on every page, so resolve session and user in one
  // round trip instead of two.
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())),
    )
    .limit(1);
  const user = row?.user;
  return user && user.isActive ? user : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}

/** Constant-time compare for the cron shared secret. */
export function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
