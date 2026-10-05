import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { query, transaction } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "mcs_session";
const SHORT_SESSION_HOURS = 12;
const LONG_SESSION_DAYS = 30;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

export type Role = "admin" | "staff";

export type SessionUser = {
  user_id: number;
  full_name: string;
  email: string;
  role: Role;
};

// ---------- passwords ----------

/** scrypt with a random 16-byte salt, stored as scrypt$<salt>$<hash> (base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when no account matches, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");
export const burnPasswordCheck = (password: string) => verifyPassword(password, DUMMY_HASH);

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 200) return "Password is too long.";
  return null;
}

// ---------- sessions ----------

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Creates a session row and sets the cookie. The cookie holds the token; the database holds only its hash. */
export async function startSession(userId: number, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const ms = remember ? LONG_SESSION_DAYS * 86_400_000 : SHORT_SESSION_HOURS * 3_600_000;
  const expires = new Date(Date.now() + ms);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 255) ?? null;

  await transaction("system", async (tx) => {
    await tx.execute(`DELETE FROM user_session WHERE expires_at < NOW()`);
    await tx.execute(
      `INSERT INTO user_session (token_hash, user_id, expires_at, user_agent)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), ?)`,
      [sha256(token), userId, Math.floor(ms / 1000), userAgent],
    );
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "remember", the cookie is dropped when the browser closes.
    ...(remember ? { expires } : {}),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await transaction("system", (tx) => tx.execute(`DELETE FROM user_session WHERE token_hash = ?`, [sha256(token)]));
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached so a page and its actions query once. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [user] = await query<SessionUser>(
    `SELECT u.user_id, u.full_name, u.email, u.role
     FROM user_session s
     JOIN app_user u ON u.user_id = s.user_id
     WHERE s.token_hash = ?
       AND s.expires_at > NOW()
       AND u.is_active = TRUE`,
    [sha256(token)],
  );
  return user ?? null;
});

/** For pages: sends visitors without a valid session to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function userCount(): Promise<number> {
  const [row] = await query<{ n: number }>(`SELECT COUNT(*) AS n FROM app_user`);
  return row.n;
}

/** Only allow same-site paths after login, so ?next= cannot send people elsewhere. */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

/** Hash of this browser's session token, used to keep the current session when signing out others. */
export async function currentTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : null;
}
