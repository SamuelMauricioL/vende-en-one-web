/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CLERK_SECRET_KEY: string;
  readonly CLERK_PUBLISHABLE_KEY: string;
  readonly API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
