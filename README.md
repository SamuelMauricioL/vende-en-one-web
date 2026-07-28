# LiveLeads — Web

Frontend de **LiveLeads** (antes Vende en One). Captura leads de TikTok Live en tiempo real con clasificación IA.

## Stack

- **Astro 7** + React 19 islands
- **Tailwind CSS v4** + shadcn/ui
- **Clerk** (autenticación)
- **Vercel** (hosting)
- **Railway** (backend API)

## Requisitos

- Node.js 22+
- pnpm (`npm install -g pnpm`)

## Instalación

```bash
pnpm install
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
PUBLIC_CLERK_SIGN_IN_URL=/sign-in
PUBLIC_CLERK_SIGN_UP_URL=/sign-up
API_BASE_URL=https://vende-en-one-api-production.up.railway.app
```

## Desarrollo

```bash
pnpm dev
```

## Deploy

Conecta el repo a Vercel. Las env vars se configuran en el dashboard.
