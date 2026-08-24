'use server';

import { headers } from 'next/headers';
import { Resend } from 'resend';
import { z } from 'zod';

import { mailConfigured, mailEnv } from '@/lib/env';
import {
  MAX_QUOTE_PHOTOS,
  MAX_QUOTE_PHOTO_BYTES,
  MAX_QUOTE_TOTAL_BYTES,
} from '@/lib/quote-limits';
import { InvalidImageError, processImage } from '@/lib/images';
import { site } from '@/content/site';

/**
 * Quote requests.
 *
 * Cloudflare Email Routing is what delivers `info@mphmeistrid.ee` to the company's real
 * inbox, but it is inbound-only and has no send API, so the form itself goes out through
 * Resend. Photos are attached to the message rather than stored: nothing to clean up, no
 * public bucket writes from an unauthenticated form, and the client gets the pictures
 * where they already read their mail.
 */

export type QuoteState = { ok?: boolean; error?: string; field?: 'name' | 'phone' | 'email' };


const schema = z.object({
  name: z.string().trim().min(2).max(120),
  // Deliberately loose: Estonian numbers get written +372 5xx xxxx, 5xxxxxxx, 372-5xxxxxx.
  // Rejecting a real customer over formatting costs more than a malformed number does.
  phone: z.string().trim().min(5).max(40).regex(/^[\d\s+()./-]+$/),
  email: z.union([z.email(), z.literal('')]).optional(),
  message: z.string().trim().max(4000).optional(),
  // Honeypot. Real people leave it empty; most bots fill every field they find.
  website: z.string().max(0).optional(),
});

export async function submitQuoteAction(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  if (!mailConfigured()) {
    return { error: 'Vormi saatmine ei ole hetkel võimalik. Palun helista.' };
  }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') ?? '',
    message: formData.get('message') ?? '',
    website: formData.get('website') ?? '',
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === 'name') return { error: 'Palun kirjuta oma nimi.', field: 'name' };
    if (field === 'phone') return { error: 'Palun kirjuta telefoninumber.', field: 'phone' };
    if (field === 'email') return { error: 'See e-posti aadress ei ole õige.', field: 'email' };
    // The honeypot was filled. Report success so the bot does not learn what happened.
    if (field === 'website') return { ok: true };
    return { error: 'Palun kontrolli välju ja proovi uuesti.' };
  }

  // `.trim()` only removes leading and trailing whitespace, and `\s` in the phone pattern
  // matches CR and LF, so both fields can still carry interior newlines. Resend is a JSON
  // API rather than SMTP, so this is not header injection — but a phone number containing a
  // newline followed by `E-post: attacker@example.com` would render as a forged field in the
  // message the client reads and acts on.
  const input = {
    ...parsed.data,
    name: oneLine(parsed.data.name),
    phone: oneLine(parsed.data.phone),
  };

  if (!(await verifyTurnstile(formData.get('cf-turnstile-response')))) {
    return { error: 'Rämpsposti kontroll ebaõnnestus. Palun proovi uuesti.' };
  }

  const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);

  if (photos.length > MAX_QUOTE_PHOTOS) {
    return { error: `Korraga saab saata kuni ${MAX_QUOTE_PHOTOS} fotot.` };
  }
  if (photos.some((f) => f.size > MAX_QUOTE_PHOTO_BYTES)) {
    return { error: 'Üks fotodest on liiga suur.' };
  }
  if (photos.reduce((sum, f) => sum + f.size, 0) > MAX_QUOTE_TOTAL_BYTES) {
    return { error: 'Fotod on kokku liiga suured. Saada vähem fotosid.' };
  }

  const e = mailEnv();

  try {
    /*
     * Every attachment is decoded and re-encoded, never forwarded verbatim.
     *
     * Without this, anyone could post arbitrary bytes as `photos` and have them delivered to
     * the company's inbox as `foto-1.jpg`, in a message that passes SPF and DKIM for the
     * company's own domain and that the recipient is primed to open. The client-side
     * downscale is a convenience, not a control — the server has to decide for itself
     * whether these bytes are an image.
     */
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    for (const [index, file] of photos.entries()) {
      try {
        const processed = await processImage(new Uint8Array(await file.arrayBuffer()));
        const largest = processed.variants[processed.variants.length - 1];
        attachments.push({
          filename: `foto-${index + 1}.webp`,
          content: Buffer.from(largest.body),
        });
      } catch (err) {
        if (err instanceof InvalidImageError) {
          return { error: 'Üks lisatud failidest ei ole foto. Eemalda see ja proovi uuesti.' };
        }
        throw err;
      }
    }

    const resend = new Resend(e.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: e.CONTACT_FROM_EMAIL,
      to: e.CONTACT_TO_EMAIL,
      // Replies from the inbox go straight back to the customer.
      ...(input.email ? { replyTo: input.email } : {}),
      subject: `Hinnapäring: ${input.name}`,
      text: [
        `Nimi: ${input.name}`,
        `Telefon: ${input.phone}`,
        input.email ? `E-post: ${input.email}` : null,
        '',
        input.message || '(sõnumit ei lisatud)',
        '',
        photos.length > 0 ? `Lisatud ${photos.length} fotot.` : null,
        '',
        `— saadetud ${site.legalName} veebilehe vormist`,
      ]
        .filter((line) => line !== null)
        .join('\n'),
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (result.error) {
      console.error('[quote] resend rejected', result.error);
      return { error: 'Saatmine ebaõnnestus. Palun helista või proovi hiljem uuesti.' };
    }
  } catch (err) {
    console.error('[quote] send failed', err);
    return { error: 'Saatmine ebaõnnestus. Palun helista või proovi hiljem uuesti.' };
  }

  return { ok: true };
}

/**
 * Turnstile is optional in development and required in production.
 *
 * Failing open in production would mean that simply forgetting the environment variable
 * ships an unauthenticated, unthrottled endpoint that sends email from a domain with valid
 * SPF and DKIM. That is a spam relay, and it would be silent — so a missing secret is
 * treated as a failed check rather than a skipped one.
 */
async function verifyTurnstile(token: FormDataEntryValue | null): Promise<boolean> {
  const secret = mailEnv().TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (typeof token !== 'string' || !token) return false;

  const ip = (await headers()).get('cf-connecting-ip') ?? undefined;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      cache: 'no-store',
    });
    const body = (await res.json()) as { success?: boolean };
    return body.success === true;
  } catch (err) {
    console.error('[quote] turnstile verification failed', err);
    return false;
  }
}

/** Collapses CR/LF so a value cannot forge extra lines in the message the client reads. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

