/**
 * Attachment limits for the public quote form.
 *
 * Shared by the client form and the Server Action on purpose. When these lived in two
 * places they drifted: the form told customers 4 MB per photo while the server rejected
 * anything over 1.2 MB, so a perfectly ordinary 2 MB photo passed the form's own check and
 * was then refused with a different message.
 *
 * The binding constraint is Vercel's 4.5 MB serverless request-body limit, and
 * `next.config.ts` caps Server Action bodies at 4 MB below that. Everything here sits under
 * it. In practice the numbers are rarely reached: `src/lib/client-image.ts` downscales every
 * photo to 2400px before it is attached, which puts a normal phone photo at 300-900 KB.
 */

export const MAX_QUOTE_PHOTOS = 3;

/**
 * Combined size of all attachments. This, not the per-photo figure, is what the 4 MB body
 * limit actually constrains — so it is deliberately the same as the per-photo cap: one large
 * photo may use the whole budget, three may not exceed it between them.
 */
export const MAX_QUOTE_TOTAL_BYTES = 3_800_000;

export const MAX_QUOTE_PHOTO_BYTES = MAX_QUOTE_TOTAL_BYTES;
