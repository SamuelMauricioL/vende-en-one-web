# Vende en One - Web

Frontend web para **Vende en One · Live Controller**. Inicia y detén listeners de TikTok Live conectados a Convex.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (componentes accesibles y personalizables)
- **lucide-react** (iconos)
- **pnpm** (package manager)

## Requisitos

- Node.js 18+
- pnpm (`npm install -g pnpm`)

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
API_BASE_URL=https://vende-en-one-api-production.up.railway.app
```

## Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
pnpm build
pnpm start
```

## Lint

```bash
pnpm lint
```

## Estructura del proyecto

```
src/
├── app/
│   ├── api/[...path]/route.ts   # Proxy catch-all a la API upstream
│   ├── globals.css              # Estilos globales + tema personalizado
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página principal
├── components/
│   ├── ui/                      # Componentes shadcn/ui
│   ├── live-controller.tsx      # Controlador principal de lives
│   ├── lives-list.tsx           # Lista de lives activos
│   └── status-panel.tsx         # Panel de estado de la última acción
└── lib/
    └── utils.ts                 # Utilidades
```

## Deploy

El proyecto está optimizado para deploy en **Vercel**. Conecta el repositorio y Vercel detectará automáticamente Next.js.

Asegúrate de configurar la variable de entorno `API_BASE_URL` en el dashboard de Vercel.

## API Proxy

El frontend actúa como proxy hacia la API upstream. Todas las requests a `/api/*` se redirigen a `API_BASE_URL`.

Endpoints principales:
- `POST /api/lives/start` — Inicia un listener de TikTok Live
- `POST /api/lives/stop` — Detiene un listener
- `GET /api/lives` — Lista de lives activos

## Licencia

MIT
