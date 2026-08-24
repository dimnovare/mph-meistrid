import { randomBytes } from 'node:crypto';

/**
 * Short, URL-safe, collision-resistant enough for a portfolio that will hold tens of
 * projects and hundreds of photos. 12 chars of base32 is ~60 bits.
 */
const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

export function newId(length = 12): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
