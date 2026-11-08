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

## Onboarding de primer uso

Todo ocurre en `/onboarding` (el middleware manda ahí a quien entra a `/app` sin TikTok vinculado; `/link-tiktok` solo redirige a la ruta nueva):

| Paso | Pantalla | Qué hace |
|---|---|---|
| 1 | Tu cuenta | Sesión de Google vía Clerk. No hay confirmación por correo. |
| 2 | Tu TikTok | Guarda el usuario en `POST /api/users/profile/tiktok`. |
| 3 | Tus filtros | Ofrece `ONBOARDING_PRESETS` (Quiere comprar, Pregunta precio, Pregunta talla, Envío) y los crea en el servidor con `POST /api/stores/:storeId/filters` (mismo origen que lee `/app/filters`). El API deduplica por nombre, así que repetir el clic no duplica. Tiene salida "Lo hago después". |
| 4 | Tu primer live | Explica el ciclo (live en TikTok → Iniciar live → clasificación → Historial), muestra los **7 días gratis** y termina en `/app`. |

Los pasos 3 y 4 salen del prototipo (`liveleads-demo`) sin el paso de correo. Colores, fuentes y componentes son los de la web: no se importó la paleta del prototipo.

## Bandeja de rescate (`/app/inbox`)

Es la única pantalla de rescate: reemplazó al Historial. Al terminar un live, la app manda aquí. Las métricas por live (duración y leads por etapa) se ven al elegir el chip del live.

- En desktop se ve como WhatsApp Web: columna de conversaciones a la izquierda e hilo a la derecha, con "Selecciona una conversación" cuando no hay ninguna abierta. En móvil es lista → hilo a pantalla completa.
- Lista de conversaciones agrupadas por persona entre lives, con chip por live (`7 nov`) y contador de mensajes. Un chip se apaga cuando ya no le debes nada a ese live.
- El hilo muestra todos los mensajes de la persona con separador de fecha y tres desenlaces: **Abrir en TikTok** (contactado), **guardar número** (whatsapp) e **Ignorar** con motivo (no cliente / spam / ya compró).
- El estado se guarda en `localStorage.ll_inbox_state`, indexado por `tienda:tiktokUserId`. Una conversación cerrada **se reabre** si la persona vuelve a escribir.
- Reglas y modelo: `odd/tasks/inbox.md`. Pruebas: `pnpm run test` (node:test, sin dependencias nuevas).

|## Deploy

|Conecta el repo a Vercel. Las env vars se configuran en el dashboard.
|
|## API Proxy (Middleware)
|
|El frontend expone `/api/*` como proxy hacia el backend en Railway.
|Se implementa como **middleware de Astro** (`src/middleware.ts`) — no usa catch-all routes (`[...path].ts`) porque Astro 7 + Vercel adapter no las maneja correctamente.
|
|### Endpoints disponibles
|
|Endpoint | Descripción
|-|-
|`GET /api/ping` | Health check del proxy
|`GET /api/lives` | Lista lives activas
|`POST /api/lives/start` | Iniciar captura (body: `{"username":"@tiktoker"}`)
|`POST /api/lives/{id}/stop` | Detener captura
|`GET /api/lives/{id}/stats/stream` | SSE — estadísticas en tiempo real
|`GET /api/lives/{id}/chat/stream` | SSE — chat en tiempo real
|`GET /api/lives/{id}/export/csv` | Exportar leads a CSV
|
|### Backend
|
|URL: `https://vende-en-one-api-production.up.railway.app`
|Configurar en `API_BASE_URL` env var.
|