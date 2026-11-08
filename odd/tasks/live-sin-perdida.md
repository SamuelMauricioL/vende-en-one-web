# Live sin pérdida: captura, persistencia y bandeja en vivo

Hoy el live vive en memoria, se apaga 30 s después de que el último navegador se desconecta, y solo persiste al cerrar — donde además recorta a 50 mensajes. Esta feature ata el ciclo de vida a TikTok, escribe mientras captura y permite que un segundo dispositivo siga los mensajes desde la bandeja en tiempo real. Repos: `vende-en-one-api` (backend) y `vende-en-one-web` (bandeja y pantalla de live).

## Specs

S1. **El ciclo de vida lo define TikTok, no el navegador.** Una vez iniciado, el live sigue capturando aunque no haya ninguna pestaña abierta. El auto-stop por inactividad deja de apagar el live y queda solo como red de seguridad a **10 minutos**. Consecuencia aceptada: la pantalla del vendedor puede estar cerrada y la captura continúa.

S2. **Duración máxima de 24 h.** Pasado ese tope la sesión se cierra sola con resumen parcial. Es además el único límite de memoria por sesión: no hay tope de cantidad de mensajes.

S3. **Se escribe mientras se captura.** Volcado periódico cada **15 segundos o 50 coincidencias, lo que llegue primero**, más el volcado final al cerrar. Los mensajes **no vencen**: no hay purga ni TTL.

S4. **El volcado es idempotente.** Cursor `flushedThrough` en memoria para no reenviar lo ya escrito, más una llave estable por mensaje (`id` del conector; si viene vacío, hash de `texto + usuario + createdAt`) guardada como `externalId` con índice por sesión. Convex no tiene índices únicos: antes de insertar se consulta la llave y se salta si existe. `liveSessionSummary` pasa de `insert` a upsert por `sessionId`.

S5. **Cierre defensivo.** `ControlEvent.ERROR` persiste y cierra la sesión en vez de dejarla zombi; `handleEnded` desconecta el socket; `endSession` limpia `sseCount`, `idleTimers`, `idleCallbacks` y los listeners; los streams SSE cierran su respuesta al terminar.

S6. **Reconciliación al arrancar.** Las filas `liveSessions` en `live`/`connecting` sin runtime en memoria se marcan `ended` con resumen parcial y una nota de corte. Un deploy o un crash no puede dejar lives abiertos para siempre en el historial.

S7. **El navegador se reengancha sin crear sesión.** Al montar, la pantalla de live consulta `GET /lives/:username/status` y reusa el `sessionId` existente; nunca llama a `POST /lives/start` cuando ya hay sesión viva. Se elimina la condición `!initialTikTokUsername` y el reintento infinito de `useSSE` ante 404. El tope de 50 hardcodeado en el cliente desaparece.

S8. **Stream por tienda para la bandeja.** `GET /stores/:storeId/live/stream` (SSE) con el **mismo conjunto ya filtrado** que ve el vendedor: si un comentario no pasa los filtros, no existe para nadie. Autenticación con el ticket HMAC existente (`kind: "store"`). El stream se mantiene abierto entre sesiones y emite `idle`, `live` y `ended`; **no cuenta como cliente para el ciclo de vida**.

S9. **Marca de "en vivo" en la bandeja.** Bloque pinneado arriba que **solo existe mientras hay live**, con estados: conectando, `🔴 EN VIVO · @tienda · N con intención`, live terminado, y error de conexión visible en ámbar. Fila nueva con destello breve. Contador con `aria-live="polite"`; las filas no anuncian nada.

S10. **El vendedor no marca atendido: ve el estado.** Se elimina la casilla atender/desatender y el `attended_<sessionId>` del navegador. `leadStatus` es la única verdad: el resolutor la produce desde la bandeja y el cambio se publica en el stream de la tienda. `LeadRow` gana `outcome`.

S11. **Una sola réplica del API.** El estado del live vive en el proceso; el stream por tienda y la captura exigen una única instancia. Se escribe como invariante. Escalar horizontalmente requiere estado compartido con pub/sub y es un proyecto aparte.

## Tasks

Rutas: `R-API` = `vende-en-one-api` (rama `feat/live-sin-perdida`), `R-WEB` = `vende-en-one-web` (rama `feat/live-sin-perdida`).

- [x] **U1 · S3,S4 · R-API** — commit `46e484e` — Log de coincidencias sin tope separado del chat visible; `externalId` + índice por sesión en `convex/schema.ts`; volcado periódico idempotente con cursor; `saveSummary` con upsert y sin recortar a 50. Prueba: 60 coincidencias → 60 filas (hoy 50), volcar dos veces no duplica, matar el proceso conserva lo volcado.
- [x] **U2 · S1,S2,S5 · R-API** — commit `46e484e` — Ciclo de vida: auto-stop a 10 min, corte duro a 24 h, teardown en `ERROR`, `disconnect()` en `handleEnded`, cierre de streams SSE, limpieza completa en `endSession`. Prueba: un `ERROR` simulado deja la sesión persistida y `start` libre; un `ended` cierra socket y streams.
- [x] **U3 · S6 · R-API** — commit `e3b287e` — Barrido al arrancar de sesiones sin runtime: `ended` + resumen parcial + nota. Prueba: sembrar una fila `live`, arrancar la app, verificar el cierre.
- [x] **U4 · S7 · R-WEB** — commit `efdb805` — Reenganche por `status`, sin `POST /start`; quitar la condición de `initialTikTokUsername`; cortar el retry de `useSSE` ante 404; quitar el 50 del cliente. Prueba: recargar con 300 coincidencias devuelve la lista completa y sigue recibiendo.
- [x] **U5 · S8 · R-API** — commit `fa92acb` — `GET /stores/:storeId/live/stream` con ticket `kind: "store"`, resolución tienda→sesión, frames `idle|live|ended` + `LeadRow[]` + `totals` + chat. Prueba: dos dispositivos de la misma cuenta ven el mismo conjunto filtrado en menos de 1 s.
- [x] **U6 · S9 · R-WEB** — commit `e0ac03a` — Bloque pinneado "EN VIVO" en la bandeja con sus cuatro estados, destello de fila nueva y aviso de desconexión. Prueba: la banda cambia sola al empezar y terminar el live; al cortar el stream lo dice.
- [x] **U7 · S10 · R-API + R-WEB** — commit `fa92acb + 31d27f7` — `outcome` en `LeadRow`, publicación del cambio desde `PATCH /stores/:id/leads/:uid`, lectura inicial desde `leadStatus`, y borrado del atender local en `top-users`, `LeadsMobile`, `live-controller` y el diálogo de fin de live. Prueba: el resolutor marca y el vendedor lo ve en menos de 1 s sin recargar.

## Log

L1. «en caso de que el usuario cierre la pestaña el comportamiento debe ser que desde el BE se debe seguir capturando para no perder nada».

L2. «el segundo trabajador usa la misma cuenta».

L3. «quiero sse para que la latencia sea mínima, quiero que lo que esté viendo filtrado el vendedor también lo vea el que va a resolver las ventas por "bandeja"».

L4. «la pantalla de bandeja debería de tener alguna marca que le diga al usuario que está recibiendo mensajes del "en vivo"».

L5. «1. no debería tener fecha de vencimiento los mensajes … 7. dejalo en 24h … 8. con el frame de chat del stream para que sea instantaneo».

L6. «6. bloque pineado, solo aparece cuando está en vivo luego ya desaparece ese componente».

L7. «3. el usuario vendedor que está en la pantalla de live ya no tendría la función de cambiar a atender o desatender, solo vería la actualización del estado de ese mensaje en tiempo real porque el "personal resolverdor" se encargaría de eso».

L8. «5. vamos por la 1» (una sola réplica como invariante).

L9. Railway tiene una sola réplica: S11 queda confirmada como invariante.

L10. Verificación final: API 86 tests y typecheck limpio; web 73 tests y build completo. El contrato del stream se reconcilió después de la oleada 2 (el cliente asumía otro nombre de frame y otro endpoint de ticket); la versión final está en el commit `e0ac03a`.
