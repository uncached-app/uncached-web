import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';

export const prerender = false;

/**
 * Turns a Lemon Squeezy purchase into a licence the desktop app can verify.
 *
 * The app checks an Ed25519 signature against a public key compiled into it, so
 * this endpoint is the only place the private half is ever used. Nothing here
 * is a database: a licence is a signed statement, and re-deriving it from the
 * order is always possible.
 *
 * Two secrets, both Cloudflare secrets rather than `vars` in wrangler.jsonc,
 * which is public in the repository:
 *
 *   npx wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET
 *   npx wrangler secret put LICENSE_SIGNING_SEED
 *
 * `LICENSE_SIGNING_SEED` is the same 64-character hex seed the desktop's
 * `examples/license.rs` takes. Whoever holds it can mint licences.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';
const BREVO_TIMEOUT_MS = 10_000;

/** Ed25519 private keys are wrapped in this fixed PKCS#8 header before the raw seed. */
const PKCS8_ED25519_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

/**
 * Events that produce a key. A renewal issues a new one because the app has no
 * network: the key it holds expires, and the replacement arrives by email.
 */
const ISSUING_EVENTS = new Set([
  'order_created',
  'subscription_created',
  'subscription_payment_success',
]);

function getEnvVar(key: string): string | undefined {
  const runtimeValue = (cloudflareEnv as Record<string, unknown>)[key];
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) return runtimeValue.trim();
  if (import.meta.env.DEV && typeof process !== 'undefined') {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim();
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Compares in constant time. A byte-by-byte early return would leak how much of
 * a forged signature was right, which is enough to search for the rest.
 */
function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function signatureIsValid(secret: string, body: string, header: string): Promise<boolean> {
  const expected = hexToBytes(header);
  if (!expected) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return equalBytes(new Uint8Array(digest), expected);
}

/** Signs the payload with the seed, producing exactly what the app verifies. */
async function mintLicense(
  seed: Uint8Array,
  claims: Record<string, unknown>,
): Promise<string> {
  const pkcs8 = new Uint8Array(PKCS8_ED25519_PREFIX.length + seed.length);
  pkcs8.set(PKCS8_ED25519_PREFIX);
  pkcs8.set(seed, PKCS8_ED25519_PREFIX.length);

  const key = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
  const payload = new TextEncoder().encode(JSON.stringify(claims));
  const signature = await crypto.subtle.sign('Ed25519', key, payload);

  return `${base64Url(payload)}.${base64Url(new Uint8Array(signature))}`;
}

function readString(source: unknown, path: string[]): string | undefined {
  let value: unknown = source;
  for (const segment of path) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Pulls buyer and order out of the webhook.
 *
 * Written defensively on purpose: the exact field names are Lemon Squeezy's to
 * change, and one test purchase in their sandbox is worth more than any
 * assumption made here. A payload this cannot read is logged with its keys
 * rather than silently dropped.
 */
function readOrder(body: unknown): { email: string; id: string; renewsAt?: string } | null {
  const email =
    readString(body, ['data', 'attributes', 'user_email']) ??
    readString(body, ['data', 'attributes', 'customer_email']) ??
    readString(body, ['meta', 'custom_data', 'email']);
  const id =
    readString(body, ['data', 'attributes', 'identifier']) ??
    readString(body, ['data', 'id']) ??
    readString(body, ['meta', 'event_name']);
  if (!email || !id) return null;

  // Present on subscriptions, absent on a one-off. It is what decides whether
  // the licence carries an expiry, so the product type never has to be guessed.
  const renewsAt = readString(body, ['data', 'attributes', 'renews_at']);
  return { email, id, renewsAt };
}

async function emailLicense(email: string, key: string, perpetual: boolean): Promise<boolean> {
  const apiKey = getEnvVar('BREVO_API_KEY');
  if (!apiKey) return false;

  const validity = perpetual
    ? 'This licence does not expire.'
    : 'This licence covers one year. A new key arrives here when it renews.';

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: {
          name: getEnvVar('BREVO_SENDER_NAME') ?? 'Uncached',
          email: getEnvVar('BREVO_SENDER_EMAIL') ?? 'no-reply@uncached.app',
        },
        to: [{ email }],
        subject: 'Your Uncached Pro licence',
        htmlContent: `<p>Open Uncached, go to <strong>Settings &rarr; Licence</strong>, and paste this key:</p>
<p style="font-family:monospace;word-break:break-all;background:#f4f6f1;padding:12px;border-radius:8px">${key}</p>
<p>${validity} It covers one machine, and activation works offline.</p>`,
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    return response.ok;
  } catch (error) {
    console.error('[license] email failed', error);
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const secret = getEnvVar('LEMON_SQUEEZY_WEBHOOK_SECRET');
  const seedHex = getEnvVar('LICENSE_SIGNING_SEED');
  if (!secret || !seedHex) {
    console.error('[license] endpoint is not configured');
    return new Response('not configured', { status: 500 });
  }
  const seed = hexToBytes(seedHex);
  if (!seed || seed.length !== 32) {
    console.error('[license] signing seed must be 64 hex characters');
    return new Response('not configured', { status: 500 });
  }

  // Read once, as text. The signature covers these exact bytes, so re-encoding
  // a parsed object would change them and every signature would fail.
  const body = await request.text();
  const header = request.headers.get('X-Signature') ?? '';
  if (!(await signatureIsValid(secret, body, header))) {
    return new Response('bad signature', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  const event = readString(payload, ['meta', 'event_name']) ?? '';
  if (!ISSUING_EVENTS.has(event)) {
    // Acknowledged, not an error: an unhandled event must never make Lemon
    // Squeezy retry a webhook this endpoint has no work for.
    return new Response('ignored', { status: 200 });
  }

  const order = readOrder(payload);
  if (!order) {
    console.error('[license] could not read the order', {
      event,
      keys: Object.keys((payload as Record<string, unknown>)?.data ?? {}),
    });
    return new Response('unreadable order', { status: 422 });
  }

  const perpetual = !order.renewsAt;
  const key = await mintLicense(seed, {
    v: 1,
    id: order.id,
    holder: order.email,
    plan: 'pro',
    issuedAt: new Date().toISOString(),
    expiresAt: order.renewsAt ?? null,
    seats: 1,
  });

  const delivered = await emailLicense(order.email, key, perpetual);
  if (!delivered) {
    // 500 so Lemon Squeezy retries. The key is deterministic enough to re-mint,
    // and a paid licence that never arrives is the worst outcome here.
    console.error('[license] minted but not delivered', { event, id: order.id });
    return new Response('delivery failed', { status: 500 });
  }

  console.log('[license] issued', { event, id: order.id, perpetual });
  return new Response('ok', { status: 200 });
};
