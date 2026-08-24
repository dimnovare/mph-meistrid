import 'server-only';

import {
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

import { cookies } from 'next/headers';

import { SITE_URL, authEnv } from './env';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

export const SESSION_COOKIE = 'mph_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* --------------------------------------------------------------- passwords */

const SCRYPT_PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LEN = 32;

/**
 * Format: `scrypt.N.r.p.saltB64.hashB64`.
 *
 * The separator is a dot, not the `$` that the PHC string format would use, because this
 * value lives in an environment variable. Next loads `.env.local` through dotenv-expand,
 * which treats `$32768` as a variable reference and substitutes it away — a `$`-separated
 * hash silently arrives as `"scrypt==="` and every login fails with no indication why.
 * Shells, docker-compose and systemd unit files have the same hazard. Base64 never contains
 * a dot, so this stays unambiguous.
 *
 * Kept in sync with scripts/hash-password.mjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p } = SCRYPT_PARAMS;
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LEN, {
    ...SCRYPT_PARAMS,
    maxmem: 256 * 1024 * 1024,
  });
  return `scrypt.${N}.${r}.${p}.${salt.toString('base64')}.${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('.');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(
    password.normalize('NFKC'),
    Buffer.from(saltB64, 'base64'),
    expected.length,
    { N, r, p, maxmem: 256 * 1024 * 1024 },
  );

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ---------------------------------------------------------------- sessions */

type SessionPayload = { sub: string; iat: number; exp: number };

function sign(data: string): string {
  return createHmac('sha256', authEnv().AUTH_SECRET).update(data).digest('base64url');
}

function issue(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: username, iat: now, exp: now + SESSION_MAX_AGE };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** Returns the username, or null for any missing/tampered/expired token. */
export function readToken(token: string | undefined): string | null {
  if (!token) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const provided = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(body));

  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function startSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, issue(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax rather than Strict: the admin is reached by typing the URL or following a link,
    // and Strict would drop the cookie on that first navigation and bounce to login.
    // Lax still blocks the cross-site POSTs that CSRF depends on.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Current administrator, or null. Every admin page and mutating route calls this. */
export async function currentUser(): Promise<string | null> {
  const store = await cookies();
  return readToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<string> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not signed in');
    this.name = 'UnauthorizedError';
  }
}

/* -------------------------------------------------------------------- CSRF */

/**
 * Second line of defence behind `SameSite=Lax`. A cross-site form POST would carry a
 * foreign Origin; same-site requests carry ours. Requests with no Origin at all (some
 * older clients, and server-to-server) are rejected on mutating routes.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  const allowed = new Set([SITE_URL]);
  const host = request.headers.get('host');
  if (host) {
    allowed.add(`https://${host}`);
    if (process.env.NODE_ENV !== 'production') allowed.add(`http://${host}`);
  }

  return allowed.has(origin.replace(/\/$/, ''));
}

/* ----------------------------------------------------- login rate limiting */

/**
 * Per-instance, in memory. Vercel may run several instances, so this is a speed bump
 * rather than a guarantee — which is the right trade for one administrator and a
 * scrypt-hashed password. Documented in README.
 */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED = 5000;

export function loginAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) return true;
  return entry.count < MAX_ATTEMPTS;
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();

  // Bounded FIRST, before the early return below. Previously this sweep sat after the
  // "new key" branch returned, so an attacker rotating the key on every request — which is
  // exactly the shape of a brute-force run — never reached it and the map grew unbounded.
  if (attempts.size >= MAX_TRACKED) {
    for (const [key, value] of attempts) {
      if (now - value.first > WINDOW_MS) attempts.delete(key);
    }
    // If expiring did not free anything, every entry is live and we are under active abuse.
    // Dropping the map loses some counters, which is strictly better than growing until the
    // function runs out of memory.
    if (attempts.size >= MAX_TRACKED) attempts.clear();
  }

  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return;
  }
  entry.count++;
}

/**
 * The client address, as reported by the platform.
 *
 * `x-forwarded-for` is a chain, and the **leftmost** entry is whatever the client sent — an
 * attacker sets it freely, so keying a rate limit on it means every request looks like a new
 * address and the limit never trips. The rightmost entry is the one the last trusted proxy
 * appended. On Vercel, `x-vercel-forwarded-for` is set by the platform and cannot be spoofed,
 * so it is preferred when present.
 */
export function rateLimitKey(headers: Headers): string {
  const vercel = headers.get('x-vercel-forwarded-for')?.trim();
  if (vercel) return vercel;

  const chain = headers.get('x-forwarded-for');
  if (!chain) return 'unknown';

  const parts = chain.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? 'unknown';
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const e = authEnv();

  // Compare the username in constant time too, so timing cannot confirm it separately.
  const expectedUser = Buffer.from(e.ADMIN_USERNAME);
  const givenUser = Buffer.from(username);
  const userOk =
    expectedUser.length === givenUser.length && timingSafeEqual(expectedUser, givenUser);

  // Always run the hash, even on a wrong username, so both failures take the same time.
  const passwordOk = await verifyPassword(password, e.ADMIN_PASSWORD_HASH);

  return userOk && passwordOk;
}
