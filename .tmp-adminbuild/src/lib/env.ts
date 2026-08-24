import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment, validated in three independent groups.
 *
 * Deliberately not one schema. A single `env()` covering everything meant a missing R2
 * variable made *logging in* fail — the admin got a generic error while the real cause sat
 * in the server log, and nothing about the failure pointed at storage. Each group is now
 * validated only when something actually needs it, so a misconfiguration surfaces at the
 * feature it affects.
 *
 * Each group still fails loudly and with a readable list rather than limping on.
 */

function parser<T extends z.ZodType>(name: string, schema: T) {
  let cached: z.infer<T> | null = null;

  return (): z.infer<T> => {
    if (cached) return cached;

    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid ${name} configuration:\n${missing}\n\nSee .env.example.`);
    }

    cached = parsed.data;
    return cached;
  };
}

/* ------------------------------------------------------------------ storage */

export const r2Env = parser(
  'Cloudflare R2',
  z.object({
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),

    /** Public bucket: photos only. A custom domain is attached to this one. */
    R2_BUCKET: z.string().min(1),

    /**
     * Private bucket for `data/*.json`. Separate because R2 public access is granted per
     * BUCKET, not per prefix — one public bucket would put the content JSON on the open
     * internet, and that file contains unpublished drafts, which the public site does not.
     * Defaults to the media bucket so local development works with one bucket; production
     * must set it to a second, non-public bucket.
     */
    R2_DATA_BUCKET: z.string().min(1).optional(),

    /**
     * Public base URL the bucket's media is served from — an R2 custom domain such as
     * https://media.mphmeistrid.ee. Must be a CDN origin, not this app: image bytes should
     * never pass through a Node function.
     */
    R2_PUBLIC_BASE_URL: z.url(),
  }),
);

/**
 * Whether storage is configured at all, without throwing.
 *
 * Distinguishes "nobody has filled in `.env.local` yet" from "R2 is configured and broken".
 * The first should let `next build` and `npm run dev` succeed against an empty portfolio —
 * which is also the genuine day-one state of this site, so it is not a special case so much
 * as the starting one. The second must still fail loudly: silently serving an empty
 * portfolio because the bucket went away would be worse than an error.
 */
export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL,
  );
}

/* --------------------------------------------------------------------- auth */

export const authEnv = parser(
  'admin login',
  z.object({
    ADMIN_USERNAME: z.string().min(1).default('admin'),

    /**
     * `scrypt.N.r.p.saltB64.hashB64`, produced by `npm run hash-password`.
     * Dot-separated on purpose — see the note in src/lib/auth.ts about dotenv expansion.
     */
    ADMIN_PASSWORD_HASH: z
      .string()
      .regex(/^scrypt\.\d+\.\d+\.\d+\./, 'run `npm run hash-password` and copy the whole line'),

    /** 32+ random bytes, base64. Rotating it logs the administrator out. */
    AUTH_SECRET: z.string().min(32),
  }),
);

/* --------------------------------------------------------------------- mail */

export const mailEnv = parser(
  'email',
  z.object({
    RESEND_API_KEY: z.string().min(1),
    CONTACT_TO_EMAIL: z.email(),
    CONTACT_FROM_EMAIL: z.email(),
    TURNSTILE_SECRET_KEY: z.string().optional(),
  }),
);

/**
 * Whether the quote form can actually send. Reads `process.env` directly rather than going
 * through `mailEnv()`, because this is called while *rendering* the contact section to decide
 * whether to show the form at all — and throwing there would take down the page instead of
 * quietly falling back to the phone number.
 */
export function mailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL,
  );
}

/* ------------------------------------------------------------------- public */

/**
 * True on demo and preview deployments.
 *
 * A demo carries `{{PLACEHOLDER}}` copy and a portfolio that is not the client's real work.
 * If Google indexes it, the placeholders enter search results and the demo competes with the
 * real site for the same Estonian queries once that launches — duplicate content on a domain
 * we control, which is the expensive kind. So every non-production deployment serves
 * `noindex` and a disallow-all robots.txt.
 *
 * Set explicitly rather than inferred from the hostname, so promoting the site to production
 * is a deliberate act (unset the variable) and not something that happens by accident.
 */
export const NOINDEX = process.env.SITE_NOINDEX === '1';

/** Public origin. Not validated above because it is also read on the client. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mphmeistrid.ee'
).replace(/\/$/, '');
