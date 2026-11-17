# LiveLeads — Web

Frontend de **LiveLeads** (antes Vende en One): interfaz web sobre la API de
`vende-en-one-api`.

## Stack

- **Astro 7** + React 19 islands
- **Tailwind CSS v4** + shadcn/ui
- **Clerk** (autenticación)
- **Vercel** (hosting de este repo); la API corre en Railway

## Requisitos

- Node.js y pnpm (`npm install -g pnpm`)

## Instalación

```bash
pnpm install
```

## Variables de entorno

Copiar `.env.example` a `.env.local`. `src/env.d.ts` declara
`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` y `API_BASE_URL`; el código lee
además `PUBLIC_GTM_ID` en `src/layouts/Layout.astro`.

## Comandos

```bash
pnpm dev      # astro dev
pnpm build    # astro build
pnpm preview  # astro preview
pnpm test     # node --test sobre src/lib/**/*.test.ts
```

## Estructura

| Ruta | Contenido |
|---|---|
| `src/pages/` | páginas Astro |
| `src/components/` | islas React |
| `src/lib/` | lógica de cliente y sus pruebas |
| `src/middleware.ts` | autenticación de Clerk y redirecciones |
| `vercel.json` | rewrite de `/api/*` hacia la API |
| `odd/tasks/` | fichas con el porqué de las decisiones |

## Rutas

| Ruta | Archivo |
|---|---|
| `/` | `index.astro` |
| `/sign-in/*` | `sign-in/[...slug].astro` |
| `/sign-up/*` | `sign-up/[...slug].astro` |
| `/onboarding` | `onboarding.astro` |
| `/link-tiktok` | `link-tiktok.astro` (redirige a `/onboarding`) |
| `/app` | `app/index.astro` |
| `/app/admin` | `app/admin.astro` |
| `/app/billing` | `app/billing.astro` |
| `/app/filters` | `app/filters.astro` |
| `/app/inbox` | `app/inbox.astro` |
| `/app/profile` | `app/profile.astro` |
| `/terms` | `terms.astro` |
| `/privacy` | `privacy.astro` |

## API

El cliente llama a `/api/*` con rutas relativas y `vercel.json` las reescribe al
host de la API. El backend no se ejecuta en este repo.

## Reglas de negocio

Las reglas viven en el código y este documento no las repite: el tope de tiendas
lo sirve el API y el cliente lo consume desde `capabilities` en
`src/components/stores-manager.tsx`. El porqué de cada decisión está en
`odd/tasks/`.
