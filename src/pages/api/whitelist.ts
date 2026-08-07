import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';

export const prerender = false;

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

interface BrevoContactPayload {
  email: string;
  attributes?: { OS: string };
  updateEnabled: boolean;
  listIds?: number[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const ALLOWED_OPERATING_SYSTEMS = new Set(['macOS', 'Windows', 'Linux']);
const BREVO_API_URL = 'https://api.brevo.com/v3';
const BREVO_TIMEOUT_MS = 10_000;

function jsonResponse(data: { success: boolean; message: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function getEnvVar(key: string): string | undefined {
  const sources: Array<Record<string, unknown>> = [
    cloudflareEnv as Record<string, unknown>,
    import.meta.env as unknown as Record<string, unknown>,
  ];

  if (typeof process !== 'undefined') {
    sources.push(process.env as Record<string, unknown>);
  }

  for (const source of sources) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return undefined;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

async function brevoRequest(apiKey: string, path: string, payload: unknown): Promise<Response> {
  return fetch(`${BREVO_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
  });
}

async function sendBrevoEmail(apiKey: string, payload: BrevoEmailPayload): Promise<boolean> {
  try {
    const res = await brevoRequest(apiKey, '/smtp/email', payload);

    if (!res.ok) {
      console.error('[Brevo Transactional Email Error]', res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Brevo Transactional Email Network Error]', err);
    return false;
  }
}

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonResponse({ success: false, message: 'Invalid JSON body.' }, 400);
    }

    const { email, os } = body as { email?: unknown; os?: unknown };
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';

    if (trimmedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(trimmedEmail)) {
      return jsonResponse({ success: false, message: 'Please provide a valid email address.' }, 400);
    }

    const operatingSystem = typeof os === 'string' && ALLOWED_OPERATING_SYSTEMS.has(os) ? os : undefined;
    const apiKey = getEnvVar('BREVO_API_KEY');
    if (!apiKey) {
      console.error('[Whitelist API Error] Missing BREVO_API_KEY configuration.');
      return jsonResponse({ success: false, message: 'Service temporarily unavailable.' }, 503);
    }

    const listIdRaw = getEnvVar('BREVO_LIST_ID');
    const parsedListId = listIdRaw ? Number(listIdRaw) : NaN;
    const listId = Number.isInteger(parsedListId) && parsedListId > 0 ? parsedListId : undefined;
    const senderEmail = getEnvVar('BREVO_SENDER_EMAIL');
    const senderName = getEnvVar('BREVO_SENDER_NAME') || 'Uncached';
    const adminEmail = getEnvVar('ADMIN_NOTIFICATION_EMAIL');

    const contactPayload: BrevoContactPayload = {
      email: trimmedEmail,
      updateEnabled: true,
    };

    if (operatingSystem) {
      contactPayload.attributes = { OS: operatingSystem };
    }

    if (listId) {
      contactPayload.listIds = [listId];
    }

    let response = await brevoRequest(apiKey, '/contacts', contactPayload);

    if (!response.ok && response.status === 400 && contactPayload.attributes) {
      const errData = await response.clone().json().catch(() => ({}));
      if (errData?.code === 'invalid_parameter' || String(errData?.message || '').toLowerCase().includes('attribute')) {
        console.warn('[Whitelist API] OS attribute rejected; retrying without it.');
        delete contactPayload.attributes;
        response = await brevoRequest(apiKey, '/contacts', contactPayload);
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[Whitelist API Brevo Error]', response.status, errData);
      return jsonResponse({ success: false, message: 'Unable to register your email right now.' }, 502);
    }

    if (senderEmail && EMAIL_REGEX.test(senderEmail)) {
      const safeOperatingSystem = escapeHtml(operatingSystem || 'desktop');
      const safeEmail = escapeHtml(trimmedEmail);
      const welcomeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Bem-vindo ao Uncached</title>
          </head>
          <body style="margin:0; padding:40px 20px; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#f4f4f5;">
            <div style="max-width:560px; margin:0 auto; background-color:#18181b; border:1px solid #27272a; border-radius:12px; padding:32px;">
              <h1 style="font-size:24px; font-weight:700; color:#ffffff; margin-top:0; margin-bottom:16px;">
                🚀 Você está na lista VIP do Uncached!
              </h1>
              <p style="font-size:15px; line-height:1.6; color:#a1a1aa; margin-bottom:20px;">
                Olá! Confirmamos sua inscrição para acesso antecipado ao <strong>Uncached</strong> (sistema ${safeOperatingSystem}).
              </p>
              <p style="font-size:15px; line-height:1.6; color:#a1a1aa; margin-bottom:24px;">
                Em breve enviaremos novidades, atualizações de desenvolvimento e o link de acesso exclusivo para os primeiros membros da whitelist.
              </p>
              <div style="padding:16px; background-color:#27272a; border-radius:8px; font-size:13px; color:#71717a; text-align:center;">
                Obrigado por nos acompanhar nessa jornada para liberar espaço de SSD!
              </div>
            </div>
          </body>
        </html>
      `;

      await sendBrevoEmail(apiKey, {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: trimmedEmail }],
        subject: '🚀 Você está na lista de espera do Uncached!',
        htmlContent: welcomeHtml,
      });

      if (adminEmail && adminEmail !== 'admin@yourdomain.com' && EMAIL_REGEX.test(adminEmail)) {
        const adminHtml = `
          <!DOCTYPE html>
          <html>
            <body style="font-family:sans-serif; padding:20px;">
              <h2>🔔 Novo Cadastro na Whitelist!</h2>
              <p><strong>Email:</strong> ${safeEmail}</p>
              <p><strong>Sistema Operacional:</strong> ${safeOperatingSystem}</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </body>
          </html>
        `;

        await sendBrevoEmail(apiKey, {
          sender: { name: 'Uncached System', email: senderEmail },
          to: [{ email: adminEmail }],
          subject: '🔔 Novo cadastro na Whitelist',
          htmlContent: adminHtml,
        });
      }
    }

    return jsonResponse({
      success: true,
      message: 'Welcome to the whitelist!',
    });
  } catch (err) {
    console.error('[Whitelist API Internal Error]', err);
    return jsonResponse({ success: false, message: 'Internal server error occurred.' }, 500);
  }
};
