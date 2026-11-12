# Landing completa en `/waitlist`

La `/waitlist` de tiktoklive.me publica hoy solo el formulario de captura. La página completa del demo está en `landing/index.html` (`devCreceDigital/liveleads-demo`, commit `d0320d8`) y es una landing de 8 bloques con hero, demo, cómo funciona, waitlist, demo con TikTok, FAQ, contacto y footer. Acá se porta **toda su copia**, con el diseño del sitio, y el formulario pasa a ser una sección más.

## Specs

- **S1.** `/waitlist` deja de ser «formulario con hero» y pasa a ser la landing completa. Misma ruta, pública, sin sesión y fuera del gate de `/app` (`middleware.ts`: `protectedPaths` solo tiene `/app` y `/onboarding`). Compone `Layout` + `AppProviders` + `Navbar` + isla React + `Footer`, como `/kit`.
- **S2.** **Ninguna copia se pierde, se resume ni se reescribe.** Fuente de verdad: `landing/index.html` del commit `d0320d8`. Inventario cerrado de 8 bloques, en este orden:
  1. **Marca y anclas**: «Live Leads» y los enlaces «Demo», «Cómo funciona», «Preguntas», «Unirme a la waitlist».
  2. **Hero**: «De la transmisión a la venta», «No pierdas oportunidades de venta en tus lives de TikTok», su bajada («Mientras presentas, Live Leads lee el chat…»), los botones «Unirme a la waitlist» y «Probar el demo», y la nota «Acceso por tandas · sin tarjeta».
  3. **Ventana de producto con carrusel de 3 capturas**: título por captura («Live Controller», «Filtros personalizados», «Historial»), la píldora «Producto real», su pie por captura («Los leads aparecen en tiempo real mientras el chat avanza.», «Agrega las palabras clave de tu producto y cada mención cuenta como Negociando.», «Cada live queda guardado, con un botón para escribirle al DM.») y los textos alternativos de cada imagen.
  4. **Demo**: «Demo», «Pruébalo con tu cuenta de TikTok», su bajada («Ingresa el enlace de tu perfil…»), «Abrir el demo», «Unirme a la waitlist» y la nota «tiktoklive.me/app · se abre en una pestaña nueva».
  5. **Cómo funciona**: «Cómo funciona», «Tres pasos, antes y después del live», su bajada («No cambias tu forma de transmitir…»), y los 3 pasos con su etiqueta: «Antes del live / Conecta tu cuenta», «Durante el live / Identifica prospectos», «Después del live / Da seguimiento», con sus textos.
  6. **Waitlist**: «Waitlist», «Entra en la próxima tanda», su bajada («Abrimos el acceso de a pocos vendedores…»), los 5 campos del formulario, «Unirme a la waitlist», la nota «Usamos estos datos solo para organizar el acceso. No los compartimos.» y el aviso de éxito «Listo. Te escribiremos al correo cuando abramos tu tanda.»
  7. **Demo con TikTok**: «Demo con TikTok», «Pruébalo con tu propio live», su bajada («Antes de conectar nada…»), los 4 permisos (2 a favor, 2 en contra, con sus textos), «Continuar con la prueba» y «Salir sin completar».
  8. **FAQ, contacto y pie**: «Preguntas frecuentes», «Lo que conviene saber antes de entrar», las 6 preguntas con sus respuestas; «Contacto», «Hablemos de tus lives», su bajada, las 3 filas (Email `tiktoklive.leads@gmail.com`, WhatsApp `+51 934 000 821`, Teléfono `+51 914 895 330`) con sus botones «Copiar» y «Abrir chat»; y el pie «Team TikTok Live Leads», «Hecho con ♥ en Latam», «Contacto», «Volver arriba».
- **S3.** La copia vive en `src/lib/waitlist-landing/content.ts`, tipada como `Record<Locale, WaitlistContent>` con `es` y `en` en el mismo archivo. `src/lib/waitlist-landing/demo-copy.ts` es el texto visible del demo, extraído una vez del HTML (con sus atributos `placeholder`, `alt` y `aria-label`), y `content.test.ts` exige que **cada cadena española aparezca textualmente ahí**. Un test adicional comprueba el número de elementos de cada bloque (3 capturas, 3 pasos, 4 permisos, 6 FAQ, 3 filas de contacto, 5 campos).
- **S4.** Diseño solo con lo del sitio: `--bg #0b0f1a`, `--brand #fe2c55`, `--brand-2 #25f4ee`, Inter + JetBrains Mono, tarjetas `rounded-3xl` con `rgba(255,255,255,0.02)` y `1px solid rgba(255,255,255,0.06)`, botón primario `linear-gradient(135deg, #fe2c55, #e8254a)`. No se copia el CSS del demo: fuera su paleta (`#ee4d6f`, `#3fd9d8`), Plus Jakarta Sans, sus sombras y su `--grad` turquesa. Sí se **recrean** los cuatro patrones que el sitio no tiene y que el demo sí: ventana de producto con barra de título, pasos con etiqueta por momento, lista de permisos sí/no y filas de contacto con botón de copiar.
- **S5.** Carrusel del hero: 3 capturas que cambian el título de la barra y el pie; flechas anterior/siguiente y puntos con `aria-selected`; avance automático cada 5,5 s que se detiene al pasar el mouse o al enfocar y se reanuda al salir; swipe horizontal en táctil; se respeta `prefers-reduced-motion` (sin avance automático).
- **S6.** El formulario de la sección `#waitlist` conserva **exactamente** las reglas de `odd/tasks/waitlist.md` S2-S4: `email`, `store`, `tiktok` (`/^@?[A-Za-z0-9._]{2,24}$/`, normalizado a `@nick`), `category` y `frequency` en listas cerradas, honeypot `website`, y los estados enviando / inválido / fallo de red / éxito. Reusa `src/lib/waitlist.ts` **sin cambios** y `POST /api/waitlist` (tabla `waitlist` de Convex). Todos los botones «Unirme a la waitlist» (hero, anclas, demo) anclan a esa sección.
- **S7.** El bloque «Demo con TikTok» se compone de la lista de 4 permisos (2 con tick verde y 2 con cruz roja) y dos botones: «Continuar con la prueba» abre `https://www.tiktoklive.me/app` en pestaña nueva con `rel="noopener"`, y «Salir sin completar» vuelve al inicio de la página.
- **S8.** Contacto: tres filas con su etiqueta en mono; «Copiar» en Email y Teléfono escribe el valor completo y muestra «Copiado» (o «Selecciona y copia» si el portapapeles está bloqueado) durante ~1,8 s; «Abrir chat» usa `https://wa.me/51934000821` con `rel="noopener"`.
- **S9.** El FAQ de 6 preguntas usa acordeón nativo. Se extrae el acordeón existente a `src/components/faq-list.tsx` con props `{ items }` y lo usan tanto `/kit` como `/waitlist`: no se escriben dos acordeones.
- **S10.** Las 4 imágenes del demo (`demo-bg.jpg`, `slide-live-controller.jpg`, `slide-filtros.png`, `slide-historial.png`) se copian a `public/landing/`. La primera captura lleva `fetchpriority="high"`; las otras, `loading="lazy"`. Todas declaran `width` y `height` para no mover el layout. `demo-bg.jpg` se usa como fondo del bloque Demo con un degradado encima, y en móvil con cobertura completa.
- **S11.** El nav del sitio (`Navbar`) encabeza la página y debajo va una tira de anclas con las 4 del demo; la cuarta («Unirme a la waitlist») es el CTA primario. En móvil se ocultan las tres primeras y queda el CTA. La tira se pega bajo el Navbar al hacer scroll.
- **S12.** Accesibilidad y movimiento: `focus-visible` en todos los controles, `aria-roledescription="carrusel"` con `aria-label` en el contenedor, botones con `aria-label`, el pie del carrusel con `aria-live="polite"`, y cero animación cuando el sistema pide movimiento reducido.
- **S13.** Se retira lo que quede sin uso: `src/components/waitlist-page.tsx` y las claves `waitlist.*` de `src/lib/i18n/translations.ts` (en `es` y en `en`, o el `tsc` falla por `TranslationKey`). `/waitlist` deja de tener su propio hero duplicado.
- **S14.** `title` y `description` de la ruta se actualizan a la promesa del hero («No pierdas oportunidades de venta en tus lives de TikTok»), no a «Entra en la próxima tanda».
- **S15.** Lo que se prueba: contenido verbatim (S3), lógica pura del carrusel (índice, envolvente, pausa y reanudación) y del copiar contacto (valor y estados) en `src/lib/waitlist-landing/` con `node --test`; `pnpm build` y `pnpm test` completos. Nada de tests de DOM.
- **S16.** Despliegue: `vercel --prod` y verificación en producción de `GET /waitlist` 200 sin sesión y un `POST /api/waitlist` real que devuelva **201**, más la fila en el tab Leads del admin (la waitlist ya se lista ahí desde S15 de `kit-live-sin-improvisar.md`).

## Decisiones tomadas

- **D1 — destino.** `/waitlist` es la landing completa: la ruta que ya existía crece, no se crea otra ni se toca la home.
- **D2 — nav.** `Navbar` del sitio + tira de anclas con las 4 del demo; no se duplica la marca ni se pierde el selector de idioma.
- **D3 — idioma.** Español e inglés, como `/kit`, ahora que el selector comparte idioma entre islas (S17 de la ficha del kit).

## Fuera de alcance

- Tocar la home (`/`) y su hero, funnel, video o features: la landing nueva vive en `/waitlist`.
- El `waitlist-apps-script.gs` del demo y la guía de Cloudflare: la captura va a nuestro API desde `waitlist.md` L7.
- Borrar `wrangler.jsonc` o la carpeta `landing/` del repo del demo: es otro repositorio.
- Las secciones del demo que existen en CSS pero no en el HTML (`.chips`, `.lead`, `.chat`, `.demo-tools`, `.kw-list`): son restos de una versión anterior y no tienen copia visible.

## Tasks

Ruta `R-WEB` = `vende-en-one-web` (rama `feat/landing-waitlist`).

- [x] **T1 · S2,S3 · R-WEB** — `src/lib/waitlist-landing/content.ts` con los 8 bloques en `es` y `en`, `demo-copy.ts` generado desde `landing/index.html`, y `content.test.ts` con la comparación verbatim y los conteos por bloque.
- [x] **T2 · S6,S15 · R-WEB** — extraer el formulario de `waitlist-page.tsx` a `src/components/waitlist-form.tsx` reusando `src/lib/waitlist.ts`; el formulario queda como sección, no como página. Prueba: la suite existente de `waitlist.test.ts` sigue verde y el formulario conserva sus cinco campos y sus cuatro estados.
- [x] **T3 · S9,S15 · R-WEB** — extraer `src/components/faq-list.tsx` (`{ items }`) y hacer que `/kit` lo use; `waitlist-landing/faq` lo reusa con las 6 preguntas.
- [x] **T4 · S5,S15 · R-WEB** — `src/lib/waitlist-landing/carousel.ts` (índice, `go`, `next`, `prev`, `wrap`, autoplay y pausa como funciones puras) con tests, y `src/components/waitlist-slider.tsx` con la ventana de producto, flechas, puntos, pie con `aria-live` y swipe.
- [x] **T5 · S4,S7,S8 · R-WEB** — componentes que el sitio no tiene: `waitlist-steps.tsx` (3 pasos con etiqueta), `waitlist-perms.tsx` (4 filas sí/no), `waitlist-contact.tsx` (3 filas con copiar y `wa.me`), y `src/lib/waitlist-landing/contact.ts` con la lógica de copiado y sus tests.
- [x] **T6 · S1,S10,S11,S12,S14 · R-WEB** — `waitlist-landing-page.tsx` componiendo los 8 bloques en orden, la tira de anclas, las 4 imágenes en `public/landing/` y `src/pages/waitlist.astro` con el `Layout` nuevo. Prueba: `pnpm build` y revisión del HTML generado contra el inventario de S2.
- [x] **T7 · S13 · R-WEB** — retirar `waitlist-page.tsx` y las 20 claves `waitlist.*` de `translations.ts` en los dos idiomas. Prueba: `tsc --noEmit` sin errores nuevos y `grep` sin referencias colgadas.
- [x] **T8 · S16 · R-WEB** — `vercel --prod`, verificación de `/waitlist` 200 y un `POST /api/waitlist` real con 201, y la fila visible en el tab Leads.

## Log

L4. Slices en `feat/landing-waitlist` (4 commits, 4.9 KB de copia y ~1.500 líneas nuevas incluyendo el módulo de contenido en dos idiomas): `d113907` el acordeón único y el formulario como sección, `6c903e1` la copia de los 8 bloques y la lógica del carrusel y el contacto, `b3e9a4b` la página con los cuatro patrones recreados y las 4 imágenes, `e98e12a` el retiro de la página vieja, `kit-faq.tsx` y las 19 claves `waitlist.*`. Cada slice compila por separado.

L5. Verificado en local: `pnpm test` **124/124** (14 nuevos) y `pnpm build` completo; `GET /waitlist` 200 con los 8 bloques, 6 `<details>`, 4 anclas (`#waitlist #como #faq #contacto`), `aria-roledescription="carrusel"` y las 4 rutas `/landing/*`; `/kit` sigue en 200 usando el acordeón extraído. `tsc --noEmit` solo muestra los 2 errores preexistentes de `auth-button.tsx` y `lazy-sign-in.tsx`.

L6. Desplegado y verificado el 2026-11-12 (`vercel --prod`, alias `www.tiktoklive.me`): `GET /waitlist` **200** con los 8 bloques y las 19 cadenas de control presentes una por una; `POST /api/waitlist` real **201 `{created: true}`** y la fila llegó a Convex con `source: waitlist-web` y `@prueba_landing`; correo inválido **400**; `/kit` **200** sin regresión. La captura no se interrumpió en ningún momento: la ruta nunca devolvió el formulario vacío ni un 5xx.

L7. Filas de prueba a borrar del dashboard: `prueba-landing@tiktoklive.me` (waitlist), y de la ficha anterior `prueba-kit@tiktoklive.me` y `prueba-kit-2@tiktoklive.me` (lead magnets).

L1. «genial! ahora otra cosa, teníamos una página de /waitlist que tiene un formulario, ese formulario es solo una parte de la página, la página completa debe estar en la ruta de liveleads-demo/landing/ del repo de https://github.com/devCreceDigital/liveleads-demo/ vamos a hacer lo mismo que hicimos para el /kit, necesitamos copiar todo el contenido de la página pero con las reglas de diseño que tenemos en tiktoklive.me, de todas formas si esa página tiene algún componente que necesitemos recrear porque es necesario para mantenernos fiel al diseño que tiene ese repo que te pasé entonces lo hacemos, usa odd define bien el trabajo, puedes usar los sub-agentes que necesites y me avisas cuando termines»

L2. Decisiones del humano: la landing completa vive en **`/waitlist`** (la ruta que ya existe crece; no se toca la home) y se usa el **Navbar del sitio más una tira de anclas** con las 4 del demo, para no perder el selector de idioma ni duplicar la marca.

L3. Exploración de `landing/index.html` (566 líneas, 37.809 B, commit `d0320d8`): 8 bloques visibles, 4 imágenes (70 KB el fondo y entre 115 y 217 KB las tres capturas) y CSS propio con Plus Jakarta Sans y la paleta turquesa del demo. Hay CSS de un mock de producto (`.chips`, `.lead`, `.chat`, `.demo-tools`) que **no existe en el HTML**: restos de una versión anterior, sin copia visible, así que no se portan. El formulario del demo escribe a un Apps Script; el nuestro ya escribe en Convex (`waitlist.md` L7), así que la sección de waitlist reusa `src/lib/waitlist.ts` tal cual.
