import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, os } = data;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.BREVO_API_KEY;

    if (!apiKey) {
      console.log(`[Dev Whitelist] Received registration: ${email} (${os || 'Not specified'})`);
      return new Response(
        JSON.stringify({ success: true, message: 'Added to whitelist (dev mode).' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email,
        attributes: { OS: os || 'Not specified' },
        updateEnabled: true,
      }),
    });

    if (response.ok || response.status === 201 || response.status === 204) {
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
