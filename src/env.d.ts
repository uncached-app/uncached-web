/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BREVO_API_KEY?: string;
  readonly BREVO_LIST_ID?: string;
  readonly BREVO_SENDER_EMAIL?: string;
  readonly BREVO_SENDER_NAME?: string;
  readonly ADMIN_NOTIFICATION_EMAIL?: string;
  readonly PUBLIC_PADDLE_CLIENT_TOKEN?: string;
  readonly PUBLIC_PADDLE_PRICE_ANNUAL?: string;
  readonly PUBLIC_PADDLE_PRICE_LIFETIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'cloudflare:workers' {
  export const env: Record<string, any>;
}

