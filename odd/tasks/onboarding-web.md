# Onboarding web (filtros + primer live)

Integrar a la web el flujo de onboarding del prototipo (`liveleads-demo`), sin el paso de verificación por correo porque la autenticación es Google vía Clerk.

## Specs

- **S1.** El onboarding de la web replica los dos pasos del prototipo (`/bienvenida/etiquetas` y `/bienvenida/live`) dentro del flujo ya existente `sign-in → link-tiktok → app`. El paso "Confirma tu correo" **no** se implementa: "nosotros no validamos por correo, lo hacemos por google en la web de /vende-en-one-web así que ese paso no lo necesitamos".
- **S2.** El paso de etiquetas del prototipo se implementa con el mecanismo que la web ya tiene: `KeywordCategory` de `src/lib/keyword-filters.ts` persistido con `saveFilters()` (localStorage `customKeywordFilters`). Los 4 presets del prototipo ("Quiere comprar", "Pregunta precio", "Pregunta talla", "Envío") se mapean a los `LeadStage` de la web. Acciones: "Usar las recomendadas" y salida "Lo hago después".
- **S3.** Colores: reutilizar los tokens ya definidos en la web — `#0b0f1a` fondo, `#fe2c55` marca, `#25f4ee` marca-2, y los `STAGE_COLORS` (`#fe2c55` compra, `#facc15` negociando, `#4ade80` interesado). No se introduce la paleta del prototipo (`#2bb39a`, `#7b83f0`, `#f5a623`, `#29a8e0`): "igual revisa si podemos usar los mismo colores o los colores definidos ya en la web".
- **S4.** El paso "primer live" explica el ciclo real del producto y termina en navegación a `/app`.
- **S5.** El flujo conserva la protección actual del middleware: sin sesión → `/sign-in`; con sesión y sin TikTok vinculado → `/link-tiktok`.

## Tasks

- T1 · S1-S4 · stepper de 4 pasos en `/link-tiktok` + presets y guía de primer live · commit `feat(onboarding): ...`
- T2 · S1-S5 · verificación (build + recorrido en navegador) · sin commit

## Log

### L1 (pedido original, verbatim)

> tenemos que integrar el mismo flujo de onboarding a la web de /vende-en-one-web, así que vamos a tomar lo que encontraste y lo vamos a integrar, igual revisa si podemos usar los mismo colores o los colores definidos ya en la web que te dije, está al mismo nivel de la carpeta actual, usa odd y me avisas cuando termines

### L2 (corrección, verbatim)

> por cierto, nosotros no validamos por correo, lo hacemos por google en la web de /vende-en-one-web así que ese paso no lo necesitamos

### L3 (decisión de alcance)

El flujo se integra extendiendo el stepper existente de `/link-tiktok` (ya era un stepper de 2 pasos: "Autenticación" y "Tu TikTok"), en vez de crear rutas nuevas: una sola ruta, un solo punto de entrada y el middleware queda intacto.

### L4 (decisión de producto)

Se omite la línea "7 días gratis" del prototipo: la web aún no tiene facturación ni monedero, así que sería una promesa comercial que el producto no puede cumplir. Pendiente de confirmación del humano.
