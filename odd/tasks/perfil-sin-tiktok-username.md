# Perfil sin `tiktokUsername`: propiedad por tienda

`userProfiles.tiktokUsername` nació cuando un usuario tenía un solo `@` (ver `modelo-v2.md` D3/S1: «queda como dato heredado durante la migración»). Hoy conviven dos reglas de propiedad: `stores` (multi-tienda, hasta 3) y el campo del perfil, que guarda **solo el último `@` vinculado** porque `linkTikTokWithStore` lo sobrescribe en cada vinculación. Con 3 tiendas, las que no son la última no pueden iniciar live: `src/routes/lives.routes.ts` responde 403. Este documento cierra la migración: la propiedad se decide por `stores` y el campo desaparece.

## Decisiones

- **D1.** La propiedad de un `@` se decide siempre contra `stores` (`clerkUserId` + `tiktokUsername`). `userProfiles.tiktokUsername` deja de leerse en el API.
- **D2.** El campo se retira en cuatro fases desplegables por separado y en este orden obligatorio: **web deja de leerlo → API deja de escribirlo → migración limpia el dato → schema quita el campo**. Invertir el orden rompe el gate de onboarding (`web/src/middleware.ts` manda a `/onboarding` a todo el que no tenga `tiktokUsername`).
- **D3.** Antes de limpiar el dato se corre `stores:backfillFromProfiles` en modo `dryRun`; después, en modo real. Ningún perfil con `@` queda sin tienda.
- **D4.** No se borra historial: `liveSessions`, `messages` y `stores` no se tocan. El único dato que se elimina es el campo del perfil.
- **D5.** Se eliminan la mutación legacy `userProfiles:linkTikTok` y el método `convexClient.linkTikTok`, que no tienen ningún caller.

## Specs

- **S1.** La propiedad de un `@` se valida contra `stores` en las seis lecturas que antes usaban el perfil: `GET /lives` (filtro de la lista), `GET /lives/:username/status`, `POST /lives/start`, `POST /lives/stop`, `GET /lives/ticket` (`kind=monitor` y `kind=session`) y `GET /lives/history/:username`. Un usuario con 3 tiendas opera las 3 sin 403.
- **S2.** `linkTikTokWithStore` deja de escribir `userProfiles.tiktokUsername`; sigue creando la tienda y sigue creando el perfil con sus 7 días de prueba cuando no existe. `GET /users/profile/:clerkUserId` no cambia de forma: cuando el campo ya no exista, simplemente no aparece.
- **S3.** `stores:backfillFromProfiles` acepta `dryRun: true` y devuelve el plan (cuántos perfiles tienen `@`, cuántas tiendas crearía, cuántos saltaría) sin escribir. En modo real es idempotente.
- **S4.** `userProfiles:clearTiktokUsername` borra el campo documento por documento, con lote y `dryRun`, e informa cuántos limpió y cuántos quedan. Idempotente: se puede correr varias veces.
- **S5.** `web/src/middleware.ts` deja de decidir por `profile.tiktokUsername` y decide por tiendas: sin **ninguna** tienda va a `/onboarding`; un fallo del API nunca expulsa (se mantiene el comportamiento actual ante 401/403/5xx y timeout).
- **S6.** `pickActiveStore` conserva su prioridad `localStorage` → primera tienda y pierde el escalón del `@` del perfil. Un `localStorage` que apunte a una tienda de otro usuario sigue cayendo al fallback.
- **S7.** Al terminar, `userProfiles` no declara `tiktokUsername` en `convex/schema.ts` y ningún documento lo conserva, así que el deploy del schema pasa la validación de Convex sin errores de campos extra.

## Orden de despliegue

1. **T1** (API): la propiedad pasa a `stores`. Se despliega sola; arregla el 403 de las tiendas 2 y 3 y no rompe nada, porque el campo sigue ahí y sigue escribiéndose.
2. **T2** (WEB): middleware y tienda activa ya no dependen del perfil. **Debe estar desplegada antes que T3/T4**, si no el gate manda a onboarding a todos.
3. **T3** (API): se deja de escribir el campo y se borra el código muerto. Reversible con un revert.
4. **T4** (API): `dryRun` del backfill en producción → backfill real → limpieza del campo con `dryRun` → limpieza real. Los datos quedan iguales salvo el campo.
5. **T5** (API): se quita el campo del schema. **Solo después** de que T4 confirme `pendientes: 0`; si no, el deploy falla por campos extra.

Cada paso es desplegable y reversible por separado. T4 es el único que escribe en producción y no tiene vuelta atrás simétrica: lo borrado no se reconstruye (por eso T4 copia primero cualquier `@` sin tienda a `stores`).

## Entrega por cortes

- **Corte 1 — el arreglo (T1 + T2).** `feee903` (API) + `1d25144` (web). Desplegable solo: la propiedad ya es por tienda y la web ya no lee el campo, pero el campo sigue existiendo y se sigue escribiendo. Si algo sale mal, revertir estos dos no deja datos a medias.
- **Corte 2 — el retiro (T3 + T4 + T5).** `3149f23`, `9be0f05`, `cdfbdf0`. T3 y T4 son independientes de T5 en el código, pero T5 no se despliega hasta que T4 haya corrido en producción.
- **Corte 3 — documentación (T6).** Cierra la ficha y sincroniza `modelo-v2.md` y `tienda-activa.md`.

El primer corte pasa de las ~400 líneas del work unit: se deja marcado acá para que el PR se abra en dos revisiones (corte 1 y corte 2) y no en una sola.

## Tasks

Rutas: `R-API` = `vende-en-one-api` (rama `feat/perfil-sin-tiktok-username`), `R-WEB` = `vende-en-one-web` (rama `feat/perfil-sin-tiktok-username`). Sin push: el humano publica.

- [x] **T1 · S1 · R-API** — commit `feee903` — `ownUsernameOf`/`isOwn` en `src/routes/lives.routes.ts` se reemplazan por `ownUsernames()` + `findStore`; el filtro de `GET /lives`, el guard de `GET /lives/history/:username` y el ticket de streams usan la misma fuente; se borra la lectura de `profile.tiktokUsername` en los 6 sitios. Prueba: `src/routes/lives.ownership.test.ts` (6 casos, perfil con solo el último `@`) — 3 tiendas en `start`/`stop`/`status`/`ticket`/`history`, 403 en el `@` ajeno, lista filtrada, y sin tiendas `history` responde el mensaje de TikTok sin vincular.
- [x] **T2 · S5,S6 · R-WEB** — commit `1d25144` — `src/middleware.ts` decide por cantidad de tiendas (`GET /stores`) con el mismo criterio de fallo; `pickActiveStore` pierde el `@` del perfil y `resolveActiveStore` también; se borra el fetch del perfil en `AppPageClient`, `inbox-page` y `live-controller` (el `@` inicial del input ahora viene de la tienda activa). Prueba: `inbox-api.test.ts` (guardada gana, guardada inexistente cae en la primera, lista vacía → null) + `astro build` y `tsc` sin errores nuevos. El middleware no tiene test automatizado: su única rama nueva es «lista vacía → onboarding».
- [x] **T3 · S2,D5 · R-API** — commit `3149f23` — `linkTikTokWithStore` ya no escribe `tiktokUsername` (solo `updatedAt`); se borran `userProfiles:linkTikTok`, `convexClient.linkTikTok` y `LinkTikTokArgs`. Prueba: `src/routes/userProfiles.link.test.ts` — 3 tiendas dejan el perfil sin el campo y con la prueba de 7 días intacta.
- [x] **T4 · S3,S4 · R-API** — commit `9be0f05` — `dryRun` en `stores:backfillFromProfiles`; `userProfiles:clearTiktokUsername` con `dryRun`, lote y `remaining`. Prueba: `src/routes/convexMigration.test.ts` (5 casos: dryRun sin escribir, backfill idempotente, limpieza idempotente, lote respetado, `stores` intactas).
- [x] **T5 · S7 · R-API** — commit `cdfbdf0` — `tiktokUsername` fuera de `userProfiles` en `convex/schema.ts`; se retiran las dos migraciones de un solo uso (leían un campo que ya no existe en el schema y no volverán a correr). Prueba: `tsc` y suite sin referencias al campo; el deploy del schema queda para el humano, en el orden de `Orden de despliegue`.
- [ ] **T6 · cierre · R-API + R-WEB** — commit `—` — `modelo-v2.md` S1 y paso 2 actualizados, `tienda-activa.md` D6/S3 sin el `@` del perfil. Pendiente: verificar en producción que las 3 tiendas operan, que el panel de admin sigue en pie y que nadie quedó en `/onboarding`.

## Log

L1. «por qué si tenemos hasta max 3 tiendas por usuario el parámetro username de la tabla userProfile es el nombre de una de las tiendas?»

L2. «entonces también se tendría que eliminar el campo tiktokUsername?»

L3. «dale define el plan para remover usando odd si lo necesitas»

L4. «dale y hazlo todo». Decisiones de la implementación: (a) T1 tocó 6 sitios, no 5 — el ticket de streams (`GET /lives/ticket`) también leía el perfil y sin él las tiendas 2 y 3 no podían abrir el SSE; (b) las dos migraciones de T4 se retiran en T5 porque leen un campo que ya no existe en el schema y no volverán a correr — el histórico queda en git; (c) el middleware no tiene test automatizado: se verificó con `astro build` y `tsc`, y su única rama nueva es «lista de tiendas vacía → `/onboarding`».
