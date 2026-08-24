import 'server-only';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';

import { r2Env } from './env';

/**
 * Cloudflare R2 speaks the S3 API. `region` is meaningless to R2 but the SDK insists on
 * one, and 'auto' is what Cloudflare documents.
 */
let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  const e = r2Env();
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export class ObjectNotFound extends Error {
  constructor(key: string) {
    super(`R2 object not found: ${key}`);
    this.name = 'ObjectNotFound';
  }
}

/** Signals a conditional PUT that lost a race. Callers retry the read-modify-write. */
export class PreconditionFailed extends Error {
  constructor(key: string) {
    super(`R2 object changed under us: ${key}`);
    this.name = 'PreconditionFailed';
  }
}

export type GetResult = { body: Uint8Array; etag: string | undefined };

/**
 * Which bucket a key lives in.
 *
 * R2 grants public access per bucket, not per prefix. Photos must be publicly readable off
 * a CDN domain; the content JSON must not be, because it holds unpublished drafts. So they
 * live in two buckets and every call says which one it means.
 */
export type Store = 'media' | 'data';

function bucketFor(store: Store): string {
  const e = r2Env();
  return store === 'data' ? (e.R2_DATA_BUCKET ?? e.R2_BUCKET) : e.R2_BUCKET;
}

export async function getObject(key: string, store: Store = 'media'): Promise<GetResult> {
  try {
    const res = await s3().send(
      new GetObjectCommand({ Bucket: bucketFor(store), Key: key }),
    );
    const body = await res.Body!.transformToByteArray();
    return { body, etag: res.ETag };
  } catch (err) {
    if (isNotFound(err)) throw new ObjectNotFound(key);
    throw err;
  }
}

export async function putObject(
  key: string,
  body: Uint8Array | string,
  opts: {
    contentType: string;
    cacheControl?: string;
    /** ETag the caller read. `'*'` means "only if absent". Omit to overwrite blindly. */
    ifMatch?: string;
    store?: Store;
  },
): Promise<void> {
  const input: PutObjectCommandInput = {
    Bucket: bucketFor(opts.store ?? 'media'),
    Key: key,
    Body: body,
    ContentType: opts.contentType,
    CacheControl: opts.cacheControl,
  };

  // R2 supports conditional writes, and `IfMatch`/`IfNoneMatch` are real members of
  // PutObjectRequest in @aws-sdk/client-s3 — no cast needed, so a future SDK change that
  // removed them would break the build instead of silently disabling the protection.
  if (opts.ifMatch === '*') {
    input.IfNoneMatch = '*';
  } else if (opts.ifMatch) {
    input.IfMatch = opts.ifMatch;
  }

  try {
    await s3().send(new PutObjectCommand(input));
  } catch (err) {
    if (isPreconditionFailed(err)) throw new PreconditionFailed(key);
    throw err;
  }
}

/** Deletes everything under a prefix. Used when a project is removed. */
export async function deletePrefix(prefix: string, store: Store = 'media'): Promise<number> {
  const bucket = bucketFor(store);
  let deleted = 0;
  let token: string | undefined;

  do {
    const listed = await s3().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (listed.Contents ?? []).map((o) => ({ Key: o.Key! })).filter((o) => o.Key);

    if (keys.length > 0) {
      // DeleteObjects takes at most 1000 keys per call, which is also the List page size.
      await s3().send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys, Quiet: true } }),
      );
      deleted += keys.length;
    }

    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);

  return deleted;
}

/** Deletes an explicit list of keys. Used when a single photo is removed. */
export async function deleteKeys(keys: string[], store: Store = 'media'): Promise<void> {
  if (keys.length === 0) return;

  const bucket = bucketFor(store);
  // DeleteObjects accepts at most 1000 keys per call.
  for (let i = 0; i < keys.length; i += 1000) {
    await s3().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

/**
 * Public CDN URL for a media key. Never routes bytes through this app.
 *
 * Reads `process.env` directly rather than going through `r2Env()`: this runs during render,
 * and an unconfigured environment should produce a broken image rather than a broken page.
 * With no credentials there are no projects and therefore no images, so in practice this
 * branch is only reachable from a stale reference.
 */
export function publicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  return `${base}/${key.replace(/^\//, '')}`;
}

function statusOf(err: unknown): number | undefined {
  const e = err as { $metadata?: { httpStatusCode?: number }; name?: string };
  return e?.$metadata?.httpStatusCode;
}

function isNotFound(err: unknown): boolean {
  const name = (err as { name?: string })?.name;
  return name === 'NoSuchKey' || name === 'NotFound' || statusOf(err) === 404;
}

function isPreconditionFailed(err: unknown): boolean {
  const name = (err as { name?: string })?.name;
  return name === 'PreconditionFailed' || statusOf(err) === 412 || statusOf(err) === 409;
}
