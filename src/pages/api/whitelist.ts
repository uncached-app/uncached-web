import type { APIRoute } from 'astro';

export const prerender = false;

async function sendBrevoEmail(
  apiKey: string,
  payload: {
    sender: { name: string; email: string };
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
  }
) {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Brevo Transactional Email Error]', err);
    }
  } catch (err) {
    console.error('[Brevo Transactional Email Network Error]', err);
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { email, os } = data;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let cfEnv: Record<string, any> = {};
    try {
      // @ts-ignore
      const cfWorkers = await import('cloudflare:workers');
      if (cfWorkers?.env) {
        cfEnv = cfWorkers.env;
      }
    } catch {
      // Not running in Cloudflare Workers context
    }

    const runtimeEnv = cfEnv || (locals as any)?.runtime?.env || {};
    const apiKey = runtimeEnv.BREVO_API_KEY || (locals as any)?.runtime?.env?.BREVO_API_KEY || import.meta.env.BREVO_API_KEY || (typeof process !== 'undefined' ? process.env?.BREVO_API_KEY : undefined);
    const listIdRaw = runtimeEnv.BREVO_LIST_ID || (locals as any)?.runtime?.env?.BREVO_LIST_ID || import.meta.env.BREVO_LIST_ID || (typeof process !== 'undefined' ? process.env?.BREVO_LIST_ID : undefined);
    const listId = listIdRaw ? parseInt(String(listIdRaw), 10) : NaN;

    const senderEmail = runtimeEnv.BREVO_SENDER_EMAIL || (locals as any)?.runtime?.env?.BREVO_SENDER_EMAIL || import.meta.env.BREVO_SENDER_EMAIL || (typeof process !== 'undefined' ? process.env?.BREVO_SENDER_EMAIL : undefined);
    const senderName = runtimeEnv.BREVO_SENDER_NAME || (locals as any)?.runtime?.env?.BREVO_SENDER_NAME || import.meta.env.BREVO_SENDER_NAME || (typeof process !== 'undefined' ? process.env?.BREVO_SENDER_NAME : undefined) || 'Uncached';
    const adminEmail = runtimeEnv.ADMIN_NOTIFICATION_EMAIL || (locals as any)?.runtime?.env?.ADMIN_NOTIFICATION_EMAIL || import.meta.env.ADMIN_NOTIFICATION_EMAIL || (typeof process !== 'undefined' ? process.env?.ADMIN_NOTIFICATION_EMAIL : undefined);

    if (!apiKey) {
      console.log(`[Whitelist API] Received registration: ${email} (${os || 'Not specified'})`);
      return new Response(
        JSON.stringify({ success: true, message: 'Welcome to the whitelist!' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Add contact to Brevo contacts & list
    const contactPayload: Record<string, any> = {
      email: email,
      attributes: { OS: os || 'Not specified' },
      updateEnabled: true,
    };

    if (!isNaN(listId)) {
      contactPayload.listIds = [listId];
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(contactPayload),
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      // 2. Send transactional emails if sender is configured
      if (senderEmail) {
        // Welcome email to user
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
                  Olá! Confirmamos sua inscrição para acesso antecipado ao <strong>Uncached</strong> (${os ? `sistema ${os}` : 'versão desktop'}).
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

        sendBrevoEmail(apiKey, {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email }],
          subject: '🚀 Você está na lista de espera do Uncached!',
          htmlContent: welcomeHtml,
        });

        // Notification email to Admin
        if (adminEmail) {
          const adminHtml = `
            <!DOCTYPE html>
            <html>
              <body style="font-family:sans-serif; padding:20px;">
                <h2>🔔 Novo Cadastro na Whitelist!</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Sistema Operacional:</strong> ${os || 'Não informado'}</p>
                <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </body>
            </html>
          `;

          sendBrevoEmail(apiKey, {
            sender: { name: 'Uncached System', email: senderEmail },
            to: [{ email: adminEmail }],
            subject: `🔔 Novo cadastro na Whitelist: ${email}`,
            htmlContent: adminHtml,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Welcome to the whitelist!' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      const errData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ success: false, message: errData.message || 'Error adding to Brevo whitelist.' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
