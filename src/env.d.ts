/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BREVO_API_KEY?: string;
  readonly BREVO_LIST_ID?: string;
  readonly BREVO_SENDER_EMAIL?: string;
  readonly BREVO_SENDER_NAME?: string;
  readonly ADMIN_NOTIFICATION_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
