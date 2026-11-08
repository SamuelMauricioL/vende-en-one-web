# Onboarding web (filtros + primer live)

Integrar a la web el flujo de onboarding del prototipo (`liveleads-demo`), sin el paso de verificación por correo porque la autenticación es Google vía Clerk.

## Specs

- **S1.** El onboarding de la web replica los dos pasos del prototipo (`/bienvenida/etiquetas` y `/bienvenida/live`) dentro del flujo ya existente `sign-in → link-tiktok → app`. El paso "Confirma tu correo" **no** se implementa: "nosotros no validamos por correo, lo hacemos por google en la web de /vende-en-one-web así que ese paso no lo necesitamos".
- **S2.** El paso 3 del onboarding es **informativo**: muestra las categorías del embudo (Compra, Negociando, Interesado) y ejemplos de comentarios con la palabra clave subrayada en azul y su categoría a la derecha. No escribe nada en el servidor ni crea filtros: "Continuar" solo avanza, y no hay CTA de salida. Los filtros del sistema ya existen en el API (`odd/tasks/filtros-backend.md`, S2) y no se listan acá.
- **S3.** Colores: reutilizar los tokens ya definidos en la web — `#0b0f1a` fondo, `#fe2c55` marca, `#25f4ee` marca-2, y los `STAGE_COLORS` (`#fe2c55` compra, `#facc15` negociando, `#4ade80` interesado). No se introduce la paleta del prototipo (`#2bb39a`, `#7b83f0`, `#f5a623`, `#29a8e0`): "igual revisa si podemos usar los mismo colores o los colores definidos ya en la web".
- **S4.** El paso "primer live" explica el ciclo real del producto y termina en navegación a `/app`.
- **S5.** El flujo conserva la protección actual del middleware: sin sesión → `/sign-in`; con sesión y sin TikTok vinculado → `/link-tiktok`.

## Tasks

- T1 · S1-S4 · stepper de 4 pasos en `/link-tiktok` + presets y guía de primer live · commit `9e3cf4c`
- T2 · S1-S5 · verificación · sin commit (evidencia en L5)
- T3 · S4 · tarjeta de 7 días gratis + ruta `/onboarding` · commit `324b1e6`

## Log

### L1 (pedido original, verbatim)

> tenemos que integrar el mismo flujo de onboarding a la web de /vende-en-one-web, así que vamos a tomar lo que encontraste y lo vamos a integrar, igual revisa si podemos usar los mismo colores o los colores definidos ya en la web que te dije, está al mismo nivel de la carpeta actual, usa odd y me avisas cuando termines

### L2 (corrección, verbatim)

> por cierto, nosotros no validamos por correo, lo hacemos por google en la web de /vende-en-one-web así que ese paso no lo necesitamos

### L3 (decisión de alcance)

El flujo se integra extendiendo el stepper existente de `/link-tiktok` (ya era un stepper de 2 pasos: "Autenticación" y "Tu TikTok"), en vez de crear rutas nuevas: una sola ruta, un solo punto de entrada y el middleware queda intacto.

### L4 (decisión de producto)

Se omite la línea "7 días gratis" del prototipo: la web aún no tiene facturación ni monedero, así que sería una promesa comercial que el producto no puede cumplir. Pendiente de confirmación del humano.

**Corregido en L7**: el humano la pidió explícitamente y se agregó.

### L5 (verificación, T2)

- `pnpm build` → OK (sin errores; los warnings de `optimizeDeps` y del runtime Node son preexistentes).
- Pasos 3 y 4 recorridos en Chromium headless con los componentes reales: "Usar los recomendados" creaba 4 filtros en `localStorage.customKeywordFilters` con `stage` correcto, "Continuar" queda habilitado solo con filtros, "Lo hago después" avanza sin escribir nada, el CTA "Empezar" navega a `/app`. **Superado**: desde `filtros-backend.md` (T10) los presets se crean en el servidor (`POST /stores/:storeId/filters`) y no se escribe nada en el navegador.
- `customStageOverride()` con `ONBOARDING_PRESETS` reales: 14/14 casos (compra, negociando y sin match). El primer intento falló en "envías a Trujillo?" → se agregaron los stems `envi`/`enví` al preset de Envío. **Superado**: el matching y la etapa se evalúan en el API (S4); el navegador solo muestra.
- `/link-tiktok` sin sesión → 302 a `/sign-in` (middleware intacto).
- Límite conocido: el paso 2 (guardar TikTok) no se pudo ejercitar de extremo a extremo en local porque la publishable key de Clerk es de producción y solo se inicializa en el dominio `tiktoklive.me`. La transición `200 de la API → setPhase("presets")` quedó verificada por lectura, no en navegador.

### L6 (hallazgo preexistente, fuera de alcance)

`src/app/app/history/page.tsx` es un resto de Next.js: el dev server imprime `Failed to run dependency scan ... next/navigation`. No afecta a `pnpm build` ni al runtime, pero ensucia el arranque local.

### L7 (corrección del humano, verbatim)

> te faltó la pantalla de 7 días de prueba gratis

> también has el rename a /onboarding

Implementado en T3: el bloque de prueba gratis va dentro del último paso (así está en el prototipo: timeline → regalo → CTA) con el copy exacto "Tienes 7 días gratis para probarlo todo.", y la ruta pasa a `/onboarding` con `/link-tiktok` como redirect 302.

Verificación: `pnpm build` OK; en Chromium a 360px y 420px la tarjeta mide el ancho del contenedor (328/388px), usa `rgba(254,44,85,.08)` + borde `rgba(254,44,85,.25)`, el orden es timeline → regalo → "Empezar" y no hay desborde horizontal. Rutas en local: `/onboarding` → 302 `/sign-in`, `/link-tiktok` → 302 `/onboarding`. En producción, `/onboarding` respondía 404 antes de este commit: sirve como marcador objetivo del deploy.

Pendiente: si el humano quiere la prueba gratis como **paso propio** con su propio círculo en el stepper (5 círculos), hay que revisar el ancho a 360px antes de agregarlo.
