# Página `/waitlist` en tiktoklive.me

La waitlist existe hoy como página suelta en otro repo (`devCreceDigital/liveleads-demo`, `landing/index.html`): un HTML autocontenido de 566 líneas, con su propio CSS oscuro, que manda los registros a un Google Sheet vía Google Apps Script. Acá se publica la misma captura dentro de tiktoklive.me, con el diseño del sitio, y sin tocar el backend: el Sheet sigue siendo la fuente de verdad.

## Specs

- **S1.** Existe una ruta pública `/waitlist` en `vende-en-one-web`. No exige sesión, no la toca el gate de `/app` y el middleware no la redirige (`middleware.ts:5`: `protectedPaths` solo tiene `/app` y `/onboarding`). La copia vive en `src/lib/i18n/translations.ts` con sus dos idiomas. Límite conocido: el sitio resuelve el idioma en islas React y cada isla es un árbol propio, así que el selector no propaga el idioma entre islas (`context.tsx:48-58` cae a `es`); esta página se comporta igual que el resto del landing. Los valores de Categoría y Frecuencia viajan al Sheet en español a propósito: son datos que lee el negocio, no copia de interfaz.
- **S2.** Mismos campos y mismas reglas que el formulario del demo:
  - `email` — obligatorio, `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  - `store` — obligatorio ("Nombre de tu tienda").
  - `tiktok` — obligatorio, `/^@?[A-Za-z0-9._]{2,24}$/`, se envía normalizado como `@nick`.
  - `category` — lista cerrada: «Ropa y calzado», «Joyería y accesorios», «Tecnología», «Belleza y cuidado personal», «Hogar y juguetes», «Infoproductos y cursos», «Otra».
  - `frequency` — lista cerrada: «1 o 2», «3 a 5», «6 o más», «Aún no hago lives».
  - `website` — honeypot oculto, siempre vacío para una persona.
- **S3.** El envío va a nuestro API: `POST /api/waitlist` con JSON normal (`Content-Type: application/json`), sin `no-cors`, para poder leer la respuesta. Mientras envía, el botón dice «Enviando…» y queda deshabilitado. Si responde 400 o 429, o falla la red, muestra «No pudimos guardar tu registro. Inténtalo de nuevo o escríbenos por WhatsApp.» y vuelve a habilitar el botón. Con 201 oculta el formulario y muestra «Listo. Te escribiremos al correo cuando abramos tu tanda.»
- **S4.** Validación inválida: el formulario no se envía y aparece «Revisa el correo y tu usuario de TikTok (ej: @tunickname), y completa todos los campos.»
- **S5.** Copia visible, textual: eyebrow «Waitlist», título «Entra en la próxima tanda», bajada «Abrimos el acceso de a pocos vendedores para ajustar el producto con su feedback. Cuéntanos cómo vendes.», botón «Unirme a la waitlist» y nota «Usamos estos datos solo para organizar el acceso. No los compartimos.»
- **S6.** Diseño con los componentes del sitio (`Layout`, `Navbar`, `Footer`, tokens de `CtaSection.astro`): no se copia el CSS del demo ni sus cuatro imágenes.
- **S7.** Los registros viven en nuestra base: tabla `waitlist` en Convex. El Google Sheet del demo deja de ser la fuente de verdad y queda como archivo del taller. La página no necesita autenticación para enviar.
- **S8.** La validación y el armado del payload viven en un módulo puro (`src/lib/waitlist.ts`) con tests en `node --test`, para que la regla de S2 no dependa de la UI. `validateWaitlist()` devuelve `null` o el código `"invalid"`: el mensaje visible lo pone la UI desde i18n, porque la página vive en dos idiomas.

- **S9.** Tabla `waitlist`: `{ email, store, tiktok, category, frequency, source, createdAt }`, índice `by_email`. Dedupe por correo: reenviar el mismo correo no crea otra fila y devuelve `{ created: false }`.
- **S10.** `POST /waitlist` es público (sin token) y valida con zod las mismas reglas que S2; responde `201 { id, created }`, `400 { message }` si no valida y `429 { message }` si excede el throttle.
- **S11.** Throttle en memoria por IP: 5 envíos por hora. Vive en el proceso y eso alcanza porque el API corre con una sola réplica (`live-sin-pérdida` S11).
- **S12.** `GET /admin/waitlist` exige rol admin (mismo criterio que los pagos) y devuelve los registros más nuevos primero.
- **S13.** `/app/admin` muestra los registros de la waitlist debajo de los pagos pendientes: correo, tienda, `@`, categoría, lives/semana y fecha.

## Fuera de alcance

- Enlaces a `/waitlist` desde el navbar o el footer: no se pidieron; la URL se prueba directo. Si después hace falta, es un cambio de una línea en cada componente.
- Traer el hero, el carrusel de capturas, el video o el FAQ del demo: la página hace una sola cosa, capturar la waitlist.
- Leer o administrar los registros desde tiktoklive.me: se siguen viendo en el Google Sheet.

## Tasks

Ruta `R-WEB` = `vende-en-one-web` (rama `feat/waitlist`).

- [x] **T1 · S2,S8 · R-WEB** — 8 tests en `src/lib/waitlist.test.ts` (email, tienda, `@` de 1 carácter y 25, listas cerradas, honeypot, normalización); uno se vio en rojo por `@@nick` y se corrigió el normalizador a `/^@+/`. Prueba: 8/8 y suite completa 80/80. — `src/lib/waitlist.ts` con las listas cerradas, `validateWaitlist()` (devuelve el mensaje de error o `null`), `normalizeTiktok()` y `buildPayload()`; `src/lib/waitlist.test.ts` con los casos de S2 y S4. Prueba: email inválido, tienda vacía, `@` de 1 carácter, categoría o frecuencia vacías → mensaje; campos completos → `null` y `tiktok` con `@` delante; el honeypot viaja en el payload.
- [x] **T2 · S2,S3,S4,S5 · R-WEB** — `src/components/waitlist-page.tsx` (`"use client"`): hero + tarjeta con los cinco campos, honeypot off-screen, botón de ancho completo con gradiente de marca y tres estados (enviando, inválido, fallo de red) más el estado de éxito. Prueba: `tsc` sin errores nuevos y `astro build` completo. — `src/components/waitlist-form.tsx` (`"use client"`): campos, validación con T1, estados enviando/error/ok y el `POST` no-cors. Prueba: `tsc`, `astro build` y revisión del HTML generado; el envío real se valida en la URL.
- [x] **T3 · S1,S5,S6 · R-WEB** — `src/pages/waitlist.astro` con `Layout` (title/description), `AppProviders`, `Navbar`, `WaitlistPage` y `Footer`; 20 claves `waitlist.*` nuevas en `es` y `en`. Prueba: build OK; la ruta se verifica con la URL publicada. — `src/pages/waitlist.astro` con `Layout` + `Navbar` + bloque de título/bajada + `WaitlistForm` + `Footer`; claves nuevas en `src/lib/i18n/translations.ts` (es/en) para toda la copia. Prueba: build, y la página responde 200 sin sesión.
- [x] **T4 · R-WEB** — `vercel --prod` → `https://www.tiktoklive.me/waitlist` responde **200** sin redirect y sin sesión; el HTML servido trae la copia y el chunk `_astro/waitlist-page.*.js` contiene el endpoint y `no-cors`.
- [x] **T6 · S9 · R-API** — `convex/waitlist.ts` + tabla en `convex/schema.ts`: `createWaitlist` con validación de servidor, dedupe por correo y `source`. Prueba: handler con db falsa — primer envío crea, segundo del mismo correo no duplica, datos inválidos rechazan.
- [x] **T7 · S10,S11 · R-API** — `src/routes/waitlist.routes.ts`: `POST /waitlist` público con zod, throttle en memoria y cliente Convex. Prueba: 201 en el primero, 400 con correo inválido, 429 al sexto desde la misma IP, y el honeypot no escribe.
- [x] **T8 · S3 · R-WEB** — `src/lib/waitlist.ts` deja el Apps Script y hace `fetch("/api/waitlist")` normal; la isla muestra el error real ante 400/429/red. Prueba: tests de `submitWaitlist` con `fetch` falso (201 → resuelve, 400 → lanza, 429 → lanza).
- [x] **T9 · S12,S13 · R-API + R-WEB** — `GET /admin/waitlist` con guard de admin y sección «Waitlist» en `admin-page.tsx`. Prueba: 403 sin rol admin, y la lista se pinta con los campos de S13.
- [x] ~~**T5 · S3 (sin efecto) · externo**~~ — cerrada por L7: el Apps Script ya no se usa. — `vercel --prod`, verificar `https://www.tiktoklive.me/waitlist` (200, sin redirect a `/sign-in` ni a `/app`) y avisar al humano para que envíe un registro de prueba y lo vea llegar al Google Sheet.

## Bloqueo abierto (T5)

El Apps Script del demo **no está sirviendo el script**: cualquier request a su `/exec` (GET o POST, con o sin User-Agent de navegador y con `Origin`) responde un 302 hacia una página HTML de Google en vez del JSON de `dePost`. Consecuencias: (a) el formulario, al usar `no-cors`, no puede leer la respuesta y muestra «Listo.» aunque no se guarde nada; (b) el Sheet no recibe registros. La causa típica es que la implementación se borró o cambió a «solo con cuenta de Google»; la guía del demo pide «Ejecutar como: Yo / Quién tiene acceso: Cualquier persona».

## Log

L1. «revisa el repo de https://github.com/devCreceDigital/liveleads-demo/tree/main/landing hay una pagina de waitlist, tenemos que agregarlo para tiktoklive.me/waitlist»

L2. «usa un subagente para que explore toda la web y luego organiza todo lo que se tiene que copiar usando odd, de por si ya te voy diciendo que te apruebo todo, me avisas cuando tenga que probar la url para valida»

L3. Decisiones del humano: diseño con los componentes del sitio (no copiar el HTML del demo) y los registros siguen cayendo en el Google Sheet actual.

L5. Verificación del 2026-11-10: la página quedó publicada, pero el endpoint del Sheet está caído. No se puede validar el guardado hasta redeployar el Apps Script o cambiar de almacenamiento.

L6. El humano encarga el redeploy del Apps Script a su socio (fue quien creó el Sheet). Se queda con `no-cors` y la URL actual hasta que vuelva; cuando devuelvan la URL `/exec`, se actualiza `WAITLIST_ENDPOINT`, se redeploya y se valida con un POST real. La página no se enlaza desde el navbar ni el footer, así que no hay tráfico que pueda perder registros mientras tanto.

L8. Desplegado y verificado el 2026-11-11: `npx convex deploy` (tabla `waitlist` + índice `by_email`), Railway `aa73684d` SUCCESS, Vercel a `www.tiktoklive.me`. Comprobado en producción: `POST /waitlist` directo y `POST https://www.tiktoklive.me/api/waitlist` (el camino del navegador) devuelven 201 `created: true`; correo inválido → 400; `GET /admin/waitlist` sin token → 401; el chunk del formulario ya contiene `/api/waitlist` y no `no-cors` ni `script.google.com`. Quedan dos filas de prueba en la base (`prueba@tiktoklive.me`, `prueba2@tiktoklive.me`) para borrar desde el dashboard.

L7. «y si lo hacemos de nuestro lado que involucra?» → se cambia de almacenamiento: los registros pasan al API propio (S7, S9-S13) y el Apps Script deja de usarse. Motivo: el endpoint de Google está caído y con `no-cors` el formulario no puede avisar del fallo; con API propio el error es visible y el dato queda en la base. T5 queda cerrada sin efecto.

L4. El mapeo de la web confirmó dos cosas que cambiaron la implementación: (a) los archivos `.astro` no pueden consumir el i18n del sitio porque es un contexto React, así que la copia y el formulario viven en una isla (`waitlist-page.tsx`) y la página solo compone layout; (b) `es` es la fuente de tipos (`TranslationKey = keyof typeof es`) y `en` está tipado contra ella, así que las 20 claves se agregaron a los dos idiomas o el `tsc` falla. De paso quedó a la vista un defecto preexistente del sitio: el `LanguageSwitcher` no propaga el idioma entre islas. No se toca acá.
