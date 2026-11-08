# Tienda activa y gestión de tiendas (D3 · UX)

Un usuario puede tener hasta 3 tiendas. Hay **una tienda activa** que aplica a todos los módulos, se elige desde el **menú hamburguesa** y se guarda en el navegador. La gestión (agregar, remover) vive en **Perfil**.

## Decisiones

- **D1.** La tienda activa se guarda en `localStorage` (`ll_active_store`), no en el servidor: permite que un account manager responda la tienda 3 mientras el live corre en la tienda 1 (dispositivos y pestañas independientes).
- **D2.** El selector vive en el menú hamburguesa y aplica a **live, bandeja y filtros**.
- **D3.** Se **elimina** el CTA "Cambiar" de la pantalla de Live: cambiar de tienda se hace desde el menú.
- **D4.** Perfil gestiona las tiendas: listar, marcar la activa, **agregar** (reusando el input y las validaciones del viejo CTA "Cambiar") y **remover**.
- **D5.** Remover una tienda **con lives queda bloqueado**: las sesiones exigen `storeId`, así que borrarla dejaría su historial inalcanzable. La UI muestra cuántos lives tiene y por qué no se puede. Sin archivado en esta versión.
- **D6.** Si la tienda activa guardada ya no existe (o es de otro usuario), cae en el `@` del perfil y, si tampoco, en la primera.

## Specs

- **S1.** `GET /stores` devuelve `{ _id, tiktokUsername, sessions }`; `sessions` es el conteo de lives de esa tienda.
- **S2.** `DELETE /stores/:storeId` exige token y propiedad; responde **409** si la tienda tiene lives, con el conteo en el mensaje. Si no tiene, borra y responde `{ deleted: true }`.
- **S3.** La tienda activa se resuelve con prioridad: `localStorage` (si existe en la lista) → `@` del perfil → primera tienda.
- **S4.** Cambiar la tienda activa emite un evento para que las pantallas abiertas se actualicen sin recargar.
- **S5.** El inicio de live usa la tienda activa (no el `@` del perfil) y sigue enviando `storeId` obligatorio.
- **S6.** Agregar tienda reusa el formulario del `@` del onboarding (mismas validaciones y mensajes) y respeta el límite de 3 con el mensaje del backend.

## Tasks

- **T1 · API** (S1, S2) · `listByUser` con conteo de lives, `removeStore` que rechaza tiendas con datos, ruta `DELETE /stores/:storeId`, cliente Convex.
- **T2 · WEB** (S3, S4) · `src/lib/active-store.ts`: lectura/escritura en localStorage, `useActiveStore()` con suscripción por evento.
- **T3 · WEB** (D2, D3, S5) · selector de tienda en el menú hamburguesa + quitar el CTA "Cambiar" del Live y resolver la tienda del arranque desde la activa.
- **T4 · WEB** (D4, D5, S6) · sección "Mis tiendas" en Perfil: lista con la activa, agregar (con validaciones) y remover con el bloqueo por lives.
- **T5 · WEB** (S1) · la bandeja y los filtros leen la tienda activa; la bandeja conserva el filtro "Todas". Los filtros ya se leen del API por tienda (`GET /stores/:storeId/filters`, ver `filtros-backend.md` T8/T9): ya no hay bolsa local que separar.

## Fuera de alcance (anotado)

- ~~Filtros por tienda: hoy `customKeywordFilters` es una sola bolsa en `localStorage`. Separarla por tienda es un cambio de datos aparte; en esta versión los filtros siguen siendo del usuario, no de la tienda.~~ **Resuelto** en `odd/tasks/filtros-backend.md`: los filtros (sistema + tienda) viven en el API llaveados por `storeId` y el navegador solo los muestra. `localStorage` queda únicamente para la tienda activa (`ll_active_store`, D1), que no cambió.

## Log

### L1 (pedido, verbatim)

> yo creo que lo mejor sería que en el menú hamburguesa haya un selector de tienda y desde ahí se aplica la tienda que usarían todos los módulos, live, bandeja, filtros
> y desde el perfil se puede hacer la gestión de tiendas, si quiere, agregar o remover una tienda, y para el agregar llevate el input text y las validaciones del CTA de "cambiar" que está en la pantalla de "Live" y removemos ese CTA de "cambiar" porque ahora se cambiaría de perfil desde el dropdown del menú hamburguesa

### L2 (decisiones previas del humano)

Tienda activa en el navegador (no en el servidor) y filtro "Todas" en la bandeja.
