# Perfil sin `tiktokUsername`: propiedad por tienda

`userProfiles.tiktokUsername` nació cuando un usuario tenía un solo `@` (ver `modelo-v2.md` D3/S1: «queda como dato heredado durante la migración»). Hoy conviven dos reglas de propiedad: `stores` (multi-tienda, hasta 3) y el campo del perfil, que guarda **solo el último `@` vinculado** porque `linkTikTokWithStore` lo sobrescribe en cada vinculación. Con 3 tiendas, las que no son la última no pueden iniciar live: `src/routes/lives.routes.ts` responde 403. Este documento cierra la migración: la propiedad se decide por `stores` y el campo desaparece.

## Decisiones

- **D1.** La propiedad de un `@` se decide siempre contra `stores` (`clerkUserId` + `tiktokUsername`). `userProfiles.tiktokUsername` deja de leerse en el API.
- **D2.** El campo se retira en cuatro fases desplegables por separado y en este orden obligatorio: **web deja de leerlo → API deja de escribirlo → migración limpia el dato → schema quita el campo**. Invertir el orden rompe el gate de onboarding (`web/src/middleware.ts` manda a `/onboarding` a todo el que no tenga `tiktokUsername`).
- **D3.** Antes de limpiar el dato se corre `stores:backfillFromProfiles` en modo `dryRun`; después, en modo real. Ningún perfil con `@` queda sin tienda.
- **D4.** No se borra historial: `liveSessions`, `messages` y `stores` no se tocan. El único dato que se elimina es el campo del perfil.
- **D5.** Se eliminan la mutación legacy `userProfiles:linkTikTok` y el método `convexClient.linkTikTok`, que no tienen ningún caller.

## Specs

- **S1.** La propiedad de un `@` se valida contra `stores`, en las cinco rutas que hoy leen el perfil: `GET /lives` (filtro de la lista), `GET /lives/:username/status`, `POST /lives/start`, `POST /lives/stop` y `GET /lives/history/:username`. Un usuario con 3 tiendas opera las 3 sin 403.
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

## Tasks

Rutas: `R-API` = `vende-en-one-api` (rama `feat/perfil-sin-tiktok-username`), `R-WEB` = `vende-en-one-web` (rama `feat/perfil-sin-tiktok-username`). Sin push: el humano publica.

- [ ] **T1 · S1 · R-API** — commit `—` — `ownUsernameOf`/`isOwn` en `src/routes/lives.routes.ts` pasan a resolver contra `stores` (`findStore` del cliente Convex); el filtro de `GET /lives` y el guard de `GET /lives/history/:username` usan la misma fuente; se borra la lectura de `profile.tiktokUsername` en las 5 rutas. Prueba: con 3 tiendas, `start`, `stop`, `status` y `history` responden 200 en las 3 y 403 en el `@` de otro usuario; sin tiendas, `GET /lives` no filtra y `history` responde 403.
- [ ] **T2 · S5,S6 · R-WEB** — commit `—` — `src/middleware.ts` decide por cantidad de tiendas (`GET /stores`) con el mismo criterio de fallo (nunca expulsar por error de red o auth); `pickActiveStore` en `src/lib/inbox-api.ts` pierde el parámetro del `@` del perfil y `src/lib/active-store.ts` deja de pedir el perfil. Prueba: usuario sin tiendas → `/onboarding`; usuario con 1 tienda → su tienda activa; `localStorage` con id ajeno → primera tienda; API caída → no redirige.
- [ ] **T3 · S2,D5 · R-API** — commit `—` — `convex/userProfiles.ts`: `linkTikTokWithStore` ya no escribe `tiktokUsername`; se borran `linkTikTok` y `convexClient.linkTikTok`; se ajustan los tests que los usaban. Prueba: vincular 3 tiendas deja el perfil sin el campo y con sus 7 días de prueba intactos.
- [ ] **T4 · S3,S4 · R-API** — commit `—` — `convex/stores.ts`: `dryRun` en `backfillFromProfiles`; nuevo `convex/userProfiles.ts:clearTiktokUsername` con `dryRun`, lote y conteo de pendientes. Prueba: `dryRun` no crea ni borra nada; el backfill real crea la tienda de un perfil que solo tenía `@`; la limpieza deja `pendientes: 0` y no toca `stores` ni `liveSessions`.
- [ ] **T5 · S7 · R-API** — commit `—` — quitar `tiktokUsername` de `userProfiles` en `convex/schema.ts` y del tipo del cliente. Prueba: `npx convex dev` valida el schema sin documentos en conflicto; typecheck y suite pasan.
- [ ] **T6 · cierre · R-API + R-WEB** — commit `—` — actualizar `modelo-v2.md` (S1 deja de mencionar el dato heredado) y `tienda-activa.md` (S3 sin el escalón del perfil); verificar en producción: 3 tiendas operan, el panel de admin sigue funcionando y nadie quedó en onboarding.

## Log

L1. «por qué si tenemos hasta max 3 tiendas por usuario el parámetro username de la tabla userProfile es el nombre de una de las tiendas?»

L2. «entonces también se tendría que eliminar el campo tiktokUsername?»

L3. «dale define el plan para remover usando odd si lo necesitas»
