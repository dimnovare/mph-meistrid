#!/usr/bin/env node
/**
 * Generates the ADMIN_PASSWORD_HASH value.
 *
 *   npm run hash-password -- "the password"
 *
 * The plaintext never reaches the repository or an environment variable — only this hash
 * does. Keep the format in sync with hashPassword() in src/lib/auth.ts.
 *
 * Fields are dot-separated rather than `$`-separated: Next reads .env files through
 * dotenv-expand, which would treat `$32768` as a variable reference and quietly delete it.
 */
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

const N = 2 ** 15;
const r = 8;
const p = 1;
const KEY_LEN = 32;

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your password"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use at least 12 characters. This is the only account on the site.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scrypt(password.normalize('NFKC'), salt, KEY_LEN, {
  N,
  r,
  p,
  maxmem: 256 * 1024 * 1024,
});

console.log('\nAdd these to .env.local and to the Vercel project settings:\n');
console.log(
  `ADMIN_PASSWORD_HASH=scrypt.${N}.${r}.${p}.${salt.toString('base64')}.${key.toString('base64')}`,
);
console.log(`AUTH_SECRET=${randomBytes(32).toString('base64')}`);
console.log('');
