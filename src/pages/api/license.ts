import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';

export const prerender = false;

/**
 * Turns a Paddle Billing transaction into an Ed25519 licence the desktop app
 * verifies offline against the public key compiled into it.
 *
 * Secrets, set as Cloudflare secrets (never `vars` in wrangler.jsonc, which is
 * public in this repository):
 *
 *   npx wrangler secret put PADDLE_WEBHOOK_SECRET   # pdl_ntfset_… of the notification destination
 *   npx wrangler secret put PADDLE_API_KEY          # customer.read scope, resolves the buyer email
 *   npx wrangler secret put LICENSE_SIGNING_SEED    # 64 hex chars, same seed as examples/license.rs
 *
 * Whoever holds `LICENSE_SIGNING_SEED` can mint licences.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';
const BREVO_TIMEOUT_MS = 10_000;
const PADDLE_TIMEOUT_MS = 10_000;

/** Ed25519 private keys are wrapped in this fixed PKCS#8 header before the raw seed. */
const PKCS8_ED25519_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

/**
 * A renewal bills a new transaction that also completes, so this single event
 * covers first purchase, one-off purchase, and every renewal. The app has no
 * network: the key it holds expires and the replacement arrives by email.
 */
const ISSUING_EVENT = 'transaction.completed';

/**
 * Paddle signs `${ts}:${body}` and recommends rejecting anything older than 5s.
 * Widened because a worker cold start plus clock skew routinely exceeds that,
 * and Paddle re-signs on retry. Still bounded, so a captured body cannot be
 * replayed indefinitely.
 */
const SIGNATURE_MAX_AGE_MS = 300_000;

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

/** Parses `ts=1671552777;h1=eb4d…`. Component order is not guaranteed. */
function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
  let timestamp: string | undefined;
  let signature: string | undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name === 'ts') timestamp = value;
    else if (name === 'h1') signature = value;
  }

  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

async function signatureIsValid(secret: string, body: string, header: string): Promise<boolean> {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;

  const seconds = Number.parseInt(parsed.timestamp, 10);
  if (!Number.isFinite(seconds)) return false;
  const age = Date.now() - seconds * 1000;
  if (age > SIGNATURE_MAX_AGE_MS || age < -SIGNATURE_MAX_AGE_MS) return false;

  const expected = hexToBytes(parsed.signature);
  if (!expected) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signedPayload = new TextEncoder().encode(`${parsed.timestamp}:${body}`);
  const digest = await crypto.subtle.sign('HMAC', key, signedPayload);
  return equalBytes(new Uint8Array(digest), expected);
}

/** Signs the payload with the seed, producing exactly what the app verifies. */
async function mintLicense(seed: Uint8Array, claims: Record<string, unknown>): Promise<string> {
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

/** Sandbox and live are separate hosts, and a key is only valid on its own. */
function paddleApiBaseUrl(apiKey: string): string {
  return apiKey.startsWith('pdl_sdbx_') ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
}

/**
 * Transaction events carry `customer_id`, never the address itself, so the
 * buyer email costs one authenticated read.
 */
async function fetchCustomerEmail(apiKey: string, customerId: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      `${paddleApiBaseUrl(apiKey)}/customers/${encodeURIComponent(customerId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(PADDLE_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      console.error('[license] paddle customer lookup failed', response.status);
      return undefined;
    }
    const body = await response.json();
    return readString(body, ['data', 'email']);
  } catch (error) {
    console.error('[license] paddle customer lookup errored', error);
    return undefined;
  }
}

interface Purchase {
  readonly email: string;
  readonly id: string;
  /** End of the paid period; absent on a one-off purchase. */
  readonly expiresAt?: string;
}

async function readPurchase(apiKey: string, payload: unknown): Promise<Purchase | null> {
  const id = readString(payload, ['data', 'id']);
  if (!id) return null;

  const customerId = readString(payload, ['data', 'customer_id']);
  const email =
    (customerId ? await fetchCustomerEmail(apiKey, customerId) : undefined) ??
    readString(payload, ['data', 'custom_data', 'email']);
  if (!email) return null;

  // Present on subscription transactions, absent on a one-off. It is what
  // decides whether the licence carries an expiry, so the product type never
  // has to be guessed.
  const expiresAt = readString(payload, ['data', 'billing_period', 'ends_at']);
  return { email, id, expiresAt };
}

async function emailLicense(email: string, key: string, perpetual: boolean): Promise<boolean> {
  const apiKey = getEnvVar('BREVO_API_KEY');
  if (!apiKey) return false;

  const validity = perpetual
    ? 'This licence does not expire.'
    : 'This licence covers the period you paid for. A new key arrives here when it renews.';

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
  const secret = getEnvVar('PADDLE_WEBHOOK_SECRET');
  const paddleApiKey = getEnvVar('PADDLE_API_KEY');
  const seedHex = getEnvVar('LICENSE_SIGNING_SEED');
  if (!secret || !paddleApiKey || !seedHex) {
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
  const header = request.headers.get('Paddle-Signature') ?? '';
  if (!(await signatureIsValid(secret, body, header))) {
    return new Response('bad signature', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  const event = readString(payload, ['event_type']) ?? '';
  if (event !== ISSUING_EVENT) {
    // Acknowledged, not an error: an unhandled event must never make Paddle
    // retry a webhook this endpoint has no work for.
    return new Response('ignored', { status: 200 });
  }

  const purchase = await readPurchase(paddleApiKey, payload);
  if (!purchase) {
    console.error('[license] could not read the transaction', {
      event,
      keys: Object.keys((payload as Record<string, unknown>)?.data ?? {}),
    });
    return new Response('unreadable transaction', { status: 422 });
  }

  const perpetual = !purchase.expiresAt;
  const key = await mintLicense(seed, {
    v: 1,
    id: purchase.id,
    holder: purchase.email,
    plan: 'pro',
    issuedAt: new Date().toISOString(),
    expiresAt: purchase.expiresAt ?? null,
    seats: 1,
  });

  const delivered = await emailLicense(purchase.email, key, perpetual);
  if (!delivered) {
    // 500 so Paddle retries. The key is deterministic enough to re-mint, and a
    // paid licence that never arrives is the worst outcome here.
    console.error('[license] minted but not delivered', { event, id: purchase.id });
    return new Response('delivery failed', { status: 500 });
  }

  console.log('[license] issued', { event, id: purchase.id, perpetual });
  return new Response('ok', { status: 200 });
};
