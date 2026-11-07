# Inbox de rescate (bucle cerrado)

Después de cada live el vendedor trabaja un inbox tipo WhatsApp: lista de conversaciones con etiqueta por live, hilo completo entre lives, y un desenlace explícito por conversación. Sin desenlace explícito no hay bucle cerrado.

## Specs

- **S1.** El bucle es **cerrado**: ninguna conversación puede quedar solo "leída". Cada una termina en un desenlace explícito: `contactado`, `whatsapp` o `ignorado`. Leer no cierra nada.
- **S2.** La unidad de cierre es la **conversación** (persona + tienda), no el mensaje. Marcar un mensaje suelto no cierra la conversación; si se agrega el marcado por mensaje, es solo para ocultar ruido dentro del hilo y no cambia el estado del bucle.
- **S3.** La pantalla de chat tiene un **CTA para ignorar**, con motivo obligatorio entre "No es cliente", "Spam o broma" y "Ya compró". La acción se puede deshacer.
- **S4.** Una conversación cerrada **se reabre** si llega un mensaje nuevo con fecha posterior a su cierre. Un cierre nunca es un agujero negro.
- **S5.** Las etiquetas por live (`All`, `7 Nov`, `6 Nov`) son **vista, no estado**: se derivan de `endedAt` de cada sesión. El chip de un live muestra cuántas conversaciones de ese live siguen abiertas y se apaga al llegar a 0.
- **S6.** Persistencia de la v1 en `localStorage`, clave `ll_inbox_state`, indexada por `tienda:tiktokUserId` (la tienda entra en la clave porque el mismo TikTok puede vigilarse desde dos cuentas). Sin backend en la v1.
- **S7.** Abrir el hilo marca **visto** (guarda `lastSeenAt`) y no cierra nada. "Abrir en TikTok" registra `contactado` de forma automática, según la decisión ya tomada (auto-marcar al abrir).

## Modelo de estado

```
ll_inbox_state = {
  "<tienda>:<tiktokUserId>": {
    state: "contactado" | "whatsapp" | "ignorado",
    closedAt: number,
    reason?: "no_cliente" | "spam" | "ya_compro",
    waNumber?: string,
    lastSeenAt: number
  }
}
```

- **Abierta**: sin entrada, o entrada con `closedAt` anterior al último mensaje de la persona.
- **Cerrada**: entrada con `closedAt` >= último mensaje.
- **No leída**: tiene mensajes con fecha posterior a `lastSeenAt` (derivado, no se guarda).

## Cómo se mide el cierre

- **Conversaciones cerradas dentro de 24 h del live** (métrica principal del bucle).
- **Conversaciones abiertas por live**: lo que muestra el chip y el badge del nav.
- No se puede medir "respondió el cliente": TikTok no expone las respuestas a los DMs. Por eso el cierre registra la acción del vendedor, no el resultado.

## Tasks

| ID | Specs | Ruta | Commit |
|---|---|---|---|
| T1 | S1-S7 | spec y modelo de estado | este documento |
| T2 | seguridad | cerrar el acceso a `GET /lives/history/:username` (hoy no valida dueño) | pendiente |
| T3 | S5 | `GET /lives/inbox/:username` agregado por persona, con conteos por sesión | pendiente |
| T4 | S5 | `InboxPage`: chips por live, lista con contador, no leídos | `58dcc5b` (hilo) + este commit |
| T5 | S1-S4 | `ChatThread` con separadores de fecha y CTAs de desenlace (sobre el payload actual, sin endpoint propio) | `58dcc5b` |
| T6 | S6 | persistencia `ll_inbox_state` + reapertura por mensaje nuevo | `10aa45b` |

## Log

### L1 (pedido original, verbatim)

> ayudame a definir el bucle de rescate

### L2 (rediseño del inbox, verbatim)

> lo que imagino es como un chat de whatsapp desktop y mobile, donde tenemos tags como en whatsapp que pueden servirnos para tener un tag por cada live hecho, ejm "all" "7 de Nov" y se muestra los chats que se escribieron ese día y deben de tener el contador de cuantos mensajes escribió el usuario, y en la vista de detalle del chat de un usuario ahí se puede ver el historial de chats, separado también entre secciones como lo hace whatsapp que es coloca una burbuja de separación con la fecha "7 nov" y en esa pantalla con tan solo scrollear se puede ver todos los mensajes y también de todos los lives, me dices que necesitamos para lograr eso

### L3 (decisiones, verbatim)

> 3. ¿Dónde persiste el estado en la primera versión? — localStorage primero
> 4. ¿Cómo se marca que ya le escribiste? — Auto-marcar al abrir

### L4 (cierre del bucle, verbatim)

> debe ser un bucle cerrado, el vendedor debe marcar cuando un mensaje debe ser ignorado y en la UI debemos de tener un CTA en la pantalla de chat para marcarlo

### L5 (pendiente de confirmar)

El cierre por "le escribí" quedó automático (L3), mientras que el cierre por "ignorar" es explícito (L4). Si el humano prefiere que también "contactado" sea un CTA explícito, cambia S7 y el hilo pasa a tener dos botones de desenlace en vez de uno.

### L6 (verificación T4/T5/T6)

- `pnpm run test` → 11/11. `pnpm build` → OK. `/app/inbox` sin sesión → 302 a `/sign-in` (el prefijo `/app` ya estaba protegido; el middleware no cambió).
- Recorrido en Chromium (harness temporal, borrado antes del commit): chips `Todos · 2 / 7 nov 2 / 6 nov 1`, filas con `NUEVO`, hilo con separadores `6 nov` y `7 nov`, motivo obligatorio al ignorar, banner `Ignorado · Spam o broma`, deshacer devuelve el contador a 2, y guardar `987654321` deja `En WhatsApp · +51 987654321` con el botón Guardar deshabilitado hasta 9 dígitos.
- **Bug encontrado en el navegador, no en los tests originales:** el cierre comparaba `closedAt >= lastAt`, así que con la hora del mensaje adelantada (reloj desfasado) la conversación nunca cerraba. Se agregó `closedThrough` (último mensaje que el vendedor tenía delante) y 2 tests nuevos antes del arreglo (RED → GREEN).

### L7 (decisión de ruta)

El inbox es una pantalla nueva (`/app/inbox`) y no reemplaza `/app/history`: el Historial sigue siendo el reporte de sesiones. Pendiente de confirmación del humano si quiere fusionarlos.

### L8 (límites conocidos de la v1)

- Sin endpoint propio: el inbox usa `GET /lives/history/:username`, que devuelve todas las sesiones con `chat[]` completo. Funciona, pero no escala y hay que moverlo a T3 cuando exista auth.
- El estado vive solo en `localStorage`: no viaja entre dispositivos y borrar el navegador borra el avance. Migra cuando exista la tabla de leads.
- El hilo no pagina: pinta todos los mensajes de la persona.
