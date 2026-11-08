# Filtros en el backend: sistema + tienda, evaluación server-side

Mueve los filtros/keywords de `localStorage` a Convex por tienda, con filtros base definidos en el código del API, y traslada la evaluación (match, etapa, resaltado) al servidor, que emite solo mensajes que pasan el filtro. Repos: `vende-en-one-api` (backend + motor) y `vende-en-one-web` (UI que solo muestra).

## Specs

S1. **Scope = tienda activa.** «los filtros son de la TIENDA ACTIVA, no del usuario». Todo documento de filtros se llavea por `storeId`; la pantalla de Filtros y el vivo usan la tienda activa del navegador.

S2. **Filtros del sistema en el código del backend.** «esos filtros deben de ser generales para todo el sistema y se deben de almacenar en en el BE como constantes que podamos actualizar si necesitamos». Constante versionada en `vende-en-one-api/src/config/`, sin tabla ni seed; cambiarlas requiere deploy.

S3. **Los filtros de la tienda se suman a los del sistema.** «luego por otro lado tenemos los filtros por tienda del usuario esos filtros si se deben de agregar a los filtros diseñados del sistema». El conjunto efectivo de un live es sistema ∪ tienda.

S4. **La evaluación se hace en el backend y el stream sale limpio.** «vamos a mover la lógica de filtrar por los filtros del usuario y también del sistema al BE, de esa forma vamos a enviar un stream de mensajes ya filtrados y limpios, de esa forma el secreto de como funciona estaría reservado en el BE». El criterio de matching no viaja al navegador; el navegador no clasifica, no ordena y no resalta.

S5. **Precarga obligatoria antes del live.** «los filtros del usuario se deben de precargar antes de empezar el live, cuando el usuario abre la app, ahí se debe de obtener los filtros, sin eso no se podría empezar el live». Sin filtros cargados, el botón de iniciar live queda deshabilitado.

S6. **Un solo color.** «deberíamos tener 1 solo color que distinga que es un filtro». No se persiste `color`; se elimina la derivación por índice.

S7. **Los mensajes que no pasan el filtro se descartan.** «se descartan». No se persisten ni viajan por el stream. El conteo crudo de personas que comentaron se conserva en el payload (`totals.commented`).

S8. **Contrato JSON para que el front solo muestre.** «el IU ya no se encarga, la decisión se mueve al BE, se tiene que pensar cual sería el contrato de json el front para solo tener la tarea de mostrar».

```ts
type Span = { text: string; strong: boolean };
type LeadStage = "compra" | "negociando" | "interesado";

type LeadRow = {
  tiktokUserId: string; displayId?: string; nickname?: string;
  verified?: boolean; followerCount?: string; firstSeen: number;
  comments: number;          // solo coincidencias
  commentTexts: string[];    // solo coincidencias, texto plano
  stage: LeadStage;          // decidido en el servidor
  stageLabel: string;        // nombre del filtro que lo puso ahí
  spans: Span[];             // frase clave ya segmentada
  score: number;             // el servidor ya ordenó
};

type Totals = { commented: number; qualified: number; byStage: Record<LeadStage, number> };

type StatsFrame =
  | { type: "initial" | "update"; stats: LeadRow[]; totals: Totals }
  | { type: "delta"; stats: LeadRow; totals: Totals }
  | { type: "status"; status: string; error?: string };
```

Orden del servidor: prioridad de etapa (`compra` > `negociando` > `interesado`) y dentro de cada etapa `score` descendente. El cliente NO reordena.

Contrato de filtros (`GET /stores/:storeId/filters`):

```ts
type FilterView = {
  source: "system" | "store";   // solo "store" es editable/borrable
  id: string;
  name: string;
  keywords: string[];
  stage: LeadStage;
  editable: boolean;
};
// GET    /stores/:storeId/filters          → { filters: FilterView[] }
// POST   /stores/:storeId/filters          body { keywords: string[]; name?: string; stage?: LeadStage } → { filter: FilterView }
// PATCH  /stores/:storeId/filters/:id      body { keywords?: string[]; name?: string; stage?: LeadStage } → { filter: FilterView }
// DELETE /stores/:storeId/filters/:id      → { ok: true }
```

S9. **No se migran los filtros viejos del navegador.** «ahora la web nadie la usa, esto es un mvp así que no es necesario tomar en cuenta esos filtros guardados en el navegador». Corte duro: se elimina la persistencia local, sin backfill ni doble lectura.

S10. **Buenas prácticas.** «usa buenas prácticas para la implementación del código»: tipos explícitos, validación con Zod en las rutas, autorización por tienda existente (`authorizeStore`), sin duplicar lógica entre repos, tests por regla observable, sin `any` nuevos.

## Tasks

Rutas de trabajo: `R-API` = `/Users/samuelaimarmauriciolaime/Documents/personal/vende-en-one/vende-en-one-api` (rama `feat/filtros-backend`), `R-WEB` = `/Users/samuelaimarmauriciolaime/Documents/personal/vende-en-one/vende-en-one-web` (rama `feat/filtros-backend`).

- [ ] **T1 · S2 · R-API · C1** — `src/config/systemFilters.ts`: constantes de filtros del sistema (`name`, `keywords[]`, `stage`) + `mergeFilters(system, store)` que deduplica por nombre normalizado.
- [ ] **T2 · S4 · R-API · C1** — `src/services/filterEngine.ts`: motor de matching (regex escapada, case-insensitive), prioridad de etapa, `stageLabel` del filtro ganador, segmentación `Span[]` con fusión de solapes. Portar los patrones de intención desde `vende-en-one-web/src/lib/lead-classifier.ts` + `keyword-filters.ts`. Tests unitarios.
- [ ] **T3 · S4,S7 · R-API · C2** — `liveStatsManager.recordChat`: evaluar contra el conjunto efectivo al entrar cada comentario, guardar `stage`/`stageLabel`/`spans` en `UserStats`, descartar no coincidencias de la emisión, mantener contador crudo para `totals`. `getStats` ordena en el servidor. Filtros cargados en `manager.start`.
- [ ] **T4 · S8 · R-API · C2** — Contrato SSE en `src/routes/lives.routes.ts`: frames `initial|update|delta|status` con `stats: LeadRow[]` y `totals`; sin campos de clasificación calculados en el cliente. Actualizar `/lives/:sessionId/chat/stream` al set limpio.
- [ ] **T5 · S7 · R-API · C2** — Persistencia: `tiktokLiveManager.saveSummary`/`saveMessages` guardan solo coincidencias; `totalMessages` sin cambiar de significado silenciosamente (documentar y usar el conteo que corresponda); summary `topUsers` solo coincidencias.
- [ ] **T6 · S1,S3 · R-API · C3** — Convex: tabla `keywordFilters` en `convex/schema.ts` (`storeId`, `name`, `keywords`, `stage`, `createdAt`, `updatedAt`, índice `by_store`), `convex/keywordFilters.ts` (list/upsert/delete, idempotente por nombre), wrappers en `src/services/convexClient.ts`, rutas `/stores/:storeId/filters` en `src/routes/stores.routes.ts` con Zod + `authorizeStore`, `source`/`editable` resueltos en el servidor.
- [ ] **T7 · S10 · R-API · C3** — Tests: prioridad de etapa, solapes de spans, descarte, autorización 403/404 por tienda, upsert idempotente. `npm run typecheck` + `npm test` verdes.
- [ ] **T8 · S1,S8 · R-WEB · C1** — `src/lib/filters-api.ts`: tipos del contrato + `fetchFilters`/`createFilter`/`updateFilter`/`deleteFilter` con `authHeaders`. `src/lib/keyword-filters.ts` queda sin persistencia.
- [ ] **T9 · S3,S6 · R-WEB · C1** — `src/components/filters-page.tsx`: carga y guardado async contra el servidor, un solo color, filas `system` de solo lectura, estados de carga/error/retry, sin duplicados.
- [ ] **T10 · S3 · R-WEB · C1** — `src/components/onboarding-steps.tsx`: presets se crean en el servidor de forma idempotente (sin `localStorage`, sin duplicar).
- [ ] **T11 · S5 · R-WEB · C2** — `src/components/AppPageClient.tsx`: precarga de filtros de la tienda activa al abrir la app, recarga al cambiar de tienda, y bloqueo de "Iniciar live" mientras no haya filtros cargados.
- [ ] **T12 · S4,S8 · R-WEB · C2** — `top-users.tsx` y `LeadsMobile.tsx`: render de `stage`/`stageLabel`/`spans`/`totals`; eliminar `classifierCache`, orden local y resaltado local; borrar `src/lib/lead-classifier.ts`.
- [ ] **T13 · S10 · R-WEB · C3** — Tests (`node --test "src/lib/**/*.test.ts"`) del cliente de filtros y del mapeo del contrato; docs: `README.md:50`, `odd/tasks/onboarding-web.md:8,42-43`, `odd/tasks/tienda-activa.md:8,29,33`. `npm run build` verde.

## Log

L1. «arranca con todo, si puedes paralelizar trabajo hazlo, me avisas cuando termines todo, si hay algo que decidir me avisas» + «usa buenas prácticas para la implementación del código».

L2. «los filtros son de la TIENDA ACTIVA, no del usuario».

L3. «se mueve SOLO el almacenamiento al backend, la evaluacion de keywords se queda en el UI, para no gastar computo del servidor por cada mensaje» — revertida por L5.

L4. «ahora la web nadie la usa, esto es un mvp así que no es necesario tomar en cuenta esos filtros guardados en el navegador».

L5. «vamos a mover la lógica de filtrar por los filtros del usuario y también del sistema al BE, de esa forma vamos a enviar un stream de mensajes ya filtrados y limpios, de esa forma el secreto de como funciona estaría reservado en el BE».

L6. «en la web tenemos filtros ya prediseñados y generales, esos filtros deben de ser generales para todo el sistema y se deben de almacenar en en el BE como constantes que podamos actualizar si necesitamos, luego por otro lado tenemos los filtros por tienda del usuario esos filtros si se deben de agregar a los filtros diseñados del sistema».

L7. «los filtros del usuario se deben de precargar antes de empezar el live, cuando el usuario abre la app, ahí se debe de obtener los filtros, sin eso no se podría empezar el live».

L8. «a qué te refieres con el color del filtro? deberíamos tener 1 solo color que distinga que es un filtro».

L9. «1. se descartan 2. desde el código 3. el IU ya no se encarga, la decisión se mueve al BE, se tiene que pensar cual sería el contrato de json el front para solo tener la tarea de mostrar».
