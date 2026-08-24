#!/usr/bin/env node
/**
 * Verifies the Cloudflare R2 setup end to end before the first deploy.
 *
 *   node --env-file=.env.local scripts/check-r2.mjs
 *
 * Checks credentials, write, read, public-domain delivery and delete, then cleans up after
 * itself. Written as a script rather than a test because it needs real credentials and is
 * something you run once per environment, not on every commit.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const required = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing: ${missing.join(', ')}`);
  console.error('Run with:  node --env-file=.env.local scripts/check-r2.mjs');
  process.exit(1);
}

const bucket = process.env.R2_BUCKET;
const dataBucket = process.env.R2_DATA_BUCKET ?? bucket;
const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
const key = `media/_healthcheck/${Date.now()}.txt`;
const body = 'mph-meistrid r2 healthcheck';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

let failed = false;

function ok(label) {
  console.log(`  ok    ${label}`);
}

function bad(label, detail) {
  failed = true;
  console.log(`  FAIL  ${label}`);
  if (detail) console.log(`        ${detail}`);
}

console.log(`\nBucket ${bucket} via ${publicBase}\n`);

try {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain',
      CacheControl: 'no-store',
    }),
  );
  ok('write');
} catch (err) {
  bad('write', err.message);
  console.error('\nCredentials or bucket name are wrong, or the token lacks write access.');
  process.exit(1);
}

try {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await res.Body.transformToString();
  if (text === body) ok('read back');
  else bad('read back', `got ${JSON.stringify(text)}`);
} catch (err) {
  bad('read back', err.message);
}

// The public domain is what actually serves every photo. A bucket that works over the API
// but is not published is the most common way this site ends up with broken images.
try {
  const res = await fetch(`${publicBase}/${key}`, { cache: 'no-store' });
  if (res.ok && (await res.text()) === body) {
    ok('public domain');
  } else {
    bad('public domain', `HTTP ${res.status} from ${publicBase}/${key}`);
    console.log('        Attach a custom domain: R2 > bucket > Settings > Public access.');
  }
} catch (err) {
  bad('public domain', err.message);
}

try {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  ok('delete');
} catch (err) {
  bad('delete', err.message);
}

// The content bucket holds unpublished drafts and must NOT be reachable from the public
// domain. R2 grants public access per bucket, so putting both in one bucket publishes them.
if (dataBucket === bucket) {
  bad(
    'data bucket is separate',
    'R2_DATA_BUCKET is unset, so drafts would be served from the public domain. ' +
      'Fine locally, wrong in production — see docs/deployment.md step 1.',
  );
} else {
  ok('data bucket is separate');

  const dataKey = `data/_healthcheck-${Date.now()}.json`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: dataBucket,
        Key: dataKey,
        Body: '{}',
        ContentType: 'application/json',
      }),
    );

    let publiclyReadable = false;
    try {
      const res = await fetch(`${publicBase}/${dataKey}`, { cache: 'no-store' });
      publiclyReadable = res.ok;
    } catch {
      publiclyReadable = false;
    }

    if (publiclyReadable) {
      bad('data bucket is private', `${publicBase}/${dataKey} answered — drafts are exposed.`);
    } else {
      ok('data bucket is private');
    }

    await s3.send(new DeleteObjectCommand({ Bucket: dataBucket, Key: dataKey }));
  } catch (err) {
    bad('data bucket write', err.message);
  }
}

console.log(failed ? '\nSomething is not configured. See docs/deployment.md.\n' : '\nR2 is ready.\n');
process.exit(failed ? 1 : 0);
