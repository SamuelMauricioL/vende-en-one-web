export type LeadStage = "interesado" | "negociando" | "compra";

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; funnelPct: string }> = {
  interesado: { label: "Interesado", color: "#4ade80", funnelPct: "35%" },
  negociando: { label: "Negociando", color: "#facc15", funnelPct: "65%" },
  compra:      { label: "Compra", color: "#fe2c55", funnelPct: "97%" },
};

export const STAGE_ORDER: LeadStage[] = ["compra", "negociando", "interesado"];

export const FUNNEL_BAR_PCT: Record<LeadStage, number> = {
  interesado: 75,
  negociando: 40,
  compra: 15,
};

/* ── Filtro de contenido ofensivo / acosador ── */

const OFFENSIVE_PATTERNS: RegExp[] = [
  // Groserías directas (LATAM)
  /put[oa]/i, /huev[oó]n/i, /we[oó]n/i, /weona/i,
  /pendej[oa]/i, /cojud[oa]/i,
  /conchetumare/i, /conchesumare/i, /conchadesumadre/i,
  /mierda/i, /carajo/i, /mond[aá]/i,
  /imb[eé]cil/i, /idiota/i, /est[uú]pid[oa]/i,
  /tarad[oa]/i, /babos[oa]/i, /desgraciad[oa]/i,
  /maldit[oa]/i, /estúpid[oa]/i,
  // Perú-specific
  /webon/i, /webona/i, /webadas/i,
  /soplame/i, /sopla[st]/i,
  // Amenazas y hostilidad
  /te (voy a )?(mat[oó]|romp[oó]|part[oó]|revient[oó]|busco|encuentro)/i,
  /te (voy a )?dar (tu )?(merecido|castigo|palo|golpe|susto)/i,
  /c[aá]llate/i, /c[aá]llese/i,
  /vete (a la mierda|al carajo|a la verga|al diablo)/i,
  /vaya(se)? a la mierda/i,
  // Acoso sexual explícito
  /te (mamo|chupo|como|cojo|folio|penetro)/i,
  /mamacita/i, /mamasota/i,
  /ens[eé][ntr]ame/i, /mu[eé]strame (las tetas|el culo|la concha|la vagina)/i,
  /ens[eé][ntr]a (tus|las) tetas/i,
  /saca (tus|las) tetas/i,
  /nudes/i, /pack/i, /xxx/i, /porno/i,
  /contenido expl[ií]cito/i,
  // Palabras sexuales graves que no tienen ambigüedad en Perú
  /perr[oa]/i, /pij[aá]/i, /verga/i,
  /cul[ií]to/i, /cul[ií]ta/i,
  /culo roto/i,
];

/** Returns true si algún mensaje del usuario contiene contenido ofensivo, acosador o provocador. */
export function isOffensive(comments: string[]): boolean {
  if (!comments || comments.length === 0) return false;
  const allText = comments.join(" ");
  return OFFENSIVE_PATTERNS.some((pattern) => pattern.test(allText));
}

interface IntentGroup {
  stage: LeadStage;
  keywords: RegExp[];
}

const INTENT_PATTERNS: IntentGroup[] = [
  {
    stage: "compra",
    keywords: [
      /compro/i, /quiero\s+\d/i, /aparta/i, /ya te hice/i, /dónde pago/i,
      /lo quiero/i, /transfier/i, /ya pagu/i, /deposit/i,
      /quiero (uno|un[oa]|comprar|ya)/i, /llevo\s+\d/i, /me llevo/i,
      /llévame/i, /apártame/i, /apartado/i, /reserv/i, /encarga/i,
      /pídelo/i, /anótame/i, /apuntame/i,
      /yape/i, /plin/i, /contraentrega/i, /contra entrega/i,
      /pago contra/i, /envío contra/i,
      /deposit/i, /abon/i, /transferencia/i, /transferir/i,
      /bancaria/i, /cuenta\s+(bancaria|de ahorro|corriente)/i,
      /BCP/i, /BBVA/i, /interbank/i, /scotiabank/i, /bancolombia/i,
      /número de cuenta/i, /código QR/i, /link de pago/i,
      /qr\b/i, /datos (de pago|bancarios)/i,
      /comprobante/i, /voucher/i, /captura/i,
      /ya (pagué|deposité|transferí|yapeé|plineé|te transferí)/i,
      /listo ya pagué/i, /pago realizado/i, /confirmar pago/i,
      /confirma porfa/i,
      /whatsapp/i, /whatsap/i, /wsp\b/i, /wp\b/i,
      /al dm/i, /al interno/i, /mensaje privado/i, /inbox/i,
      /mensaje directo/i, /md\b/i,
      /escríbeme/i, /escríbeme al/i, /contáctame/i, /comunícate/i,
      /teléfono/i, /celular/i, /cel\b/i,
      /pasame tu (número|whatsapp|wp|wsp)/i,
      /me das tu número/i, /me pasas tu/i,
      /mándame (dm|mensaje|un dm|un mensaje)/i,
      /envíame un dm/i,
      /hoy mismo/i, /ahora mismo/i, /en este momento/i, /ya mismo/i,
      /urgente/i, /lo necesito ya/i, /lo quiero ya/i,
      /para hoy/i, /para mañana/i, /lo antes posible/i,
      /dirección/i, /domicilio/i, /envía a/i, /reparto/i, /reparten/i,
      /recoger/i, /recojo/i, /vengo a/i, /paso a/i,
      /dónde (va|lo mando|lo envías)/i,
      /efectivo/i, /tarjeta/i, /crédito/i, /débito/i,
      /pago (móvil|movil|con tarjeta|en efectivo)/i,
      /te escribí (mis|los) datos/i, /te mandé (mis|los) datos/i,
      /te envié (mis|los) datos/i, /te pasé (mis|los) datos/i,
      /ya (realicé|realize|hice) el (moradito|pago|depósito|abono)/i,
      /moradito/i,
      /ya te (escribí|mandé|envié) (por|al) (dm|privado|whatsapp|whatsap|wsp)/i,
      /ya te (escribí|mandé|envié) mis datos/i,
    ],
  },
  {
    stage: "negociando",
    keywords: [
      /precio/i, /cuánto cuesta/i, /cuánto (vale|es|cuesta|está)/i,
      /a cómo/i, /en cuánto/i, /cuál es el precio/i,
      /vale\s*\d/i, /cuesta/i, /precios/i,
      /\$\s*\d/i, /\d+\s*(soles|pesos)/i,
      /me das el precio/i, /me pasas precio/i, /precio por interno/i,
      /lista de precio/i, /precio por mayor/i, /precio al por mayor/i,
      /precio por cantidad/i, /precio x mayor/i,
      /envío/i, /envían/i, /envías/i, /hacen envío/i,
      /envío gratis/i, /cuánto (el envío|el delivery)/i,
      /delivery/i, /cuánto el delivery/i,
      /shalom/i, /olva/i, /serpost/i, /dhl/i, /fedex/i,
      /hacen envío/i, /hacen delivery/i, /hacen envió/i,
      /envían a/i, /envías a/i, /mandan a/i, /mandas a/i,
      /llega a/i, /llegas a/i,
      /a (todo|toda) (el Perú|la república|la costa|la sierra|la selva)/i,
      /a provincia/i, /a lima/i, /al interior/i,
      /por (shalom|olva|serpost|dhl|fedex|encomienda|bus|courier)/i,
      /tiempo de entrega/i, /demora/i, /cuándo llega/i,
      /stock/i, /disponible/i, /hay de/i, /lo tienes/i,
      /tienes en/i, /disponible en/i, /todavía hay/i,
      /lo vendes/i, /vendes/i,
      /talla/i, /tallas disponibles/i, /tamaño/i, /medidas/i,
      /color/i, /colores disponibles/i, /modelo/i,
      /garantía/i, /tiene garantía/i,
      /descuento/i, /oferta/i, /promoción/i,
      /por mayor/i, /mayorista/i, /al por mayor/i,
      /por cantidad/i, /pack/i, /combo/i, /incluye/i, /viene con/i,
      /material/i, /de qué (está hecho|es)/i,
      /calidad/i, /original/i, /réplica/i,
      /funciona/i, /especificaciones/i, /descripción/i,
      /batería/i, /peso/i, /capacidad/i, /versión/i, /tipo de/i,
      /cómo (es|funciona|se usa|se utiliza)/i,
      /caracter/i,
      /el que (está|estaba|ves|se ve|tienes)/i,
      /el de (arriba|abajo|lado|costado|detrás|adelante|frente|fondo)/i,
      /el (primero|segundo|tercero|último|siguiente)/i,
      /a (lado|costado|un lado) de/i,
      /junto (a|con|del|de la|al)/i,
      /muestra el (que|de|del)/i, /enseña el (que|de|del)/i,
      /enséñame/i, /muestra (el|la|los|las)/i,
      /el (rosa|azul|rojo|verde|negro|blanco|gris|amarillo)/i,
      /la (rosada|azul|roja|verde|negra|blanca|gris|amarilla)/i,
      /tomar(le)? (captura|foto|fotografía|pantallazo|screenshot)/i,
      /sácale (foto|captura|fotografía)/i,
      /pásame (foto|captura|imagen)/i,
      /mándame (foto|captura|imagen)/i,
      /el (modelo|estilo|diseño) (que|de)/i,
      /cuál (es|tienes|vendes|mejor)/i,
      /ese (me|lo|si|de)/i, /esa (me|la|si|de)/i,
      /quiero ver ese/i, /déjame ver/i,
      /a ver el (que|de|del|la|las|los)/i,
      /el que está (detrás|adelante|al lado|arriba|abajo)/i,
      /el de la (izquierda|derecha|mitad|punta|esquina)/i,
      /los (dos|tres) (me|los|se)/i,
      /cada (cuánto|cuanto)/i, /vale la pena/i,
      /cómo (lo|la) (vendes|tienes|consigo)/i,
      /cuándo (lo|la) (tienes|consigues|traes)/i,
      /cuándo (lo|la) puedes (tener|conseguir|traer)/i,
      /todavía (lo|la) (tienes|vendes)/i,
      /ya (lo|la) (vendiste|entregaste|descontinuaste)/i,
      /cuándo me llega/i, /cuándo (lo|me) (mandas|envías)/i,
    ],
  },
  {
    stage: "interesado",
    keywords: [
      /me interesa/i, /me interesa mucho/i,
      /me encant/i, /me gusta/i,
      /hermoso/i, /hermosa/i, /lind[oa]/i, /precios[oa]/i,
      /bonit[oa]/i, /que bonito/i,
      /espectacular/i, /increíble/i, /genial/i,
      /buen producto/i, /se ve (bien|padre|genial|increíble)/i,
      /wow/i, /me late/i,
      /fotos?/i, /manda foto/i, /más fotos/i, /pasa foto/i,
      /enseña/i, /muéstrame/i, /a ver/i, /se mira/i,
      /info/i, /más detalles/i, /más info/i,
      /info por fa/i, /información/i,
      /quiero ver/i, /me gustaría ver/i,
      /llama (la atención|mi atención)/i,
      /que (lindo|hermoso|bonito|espectacular)/i,
      /me interesa mucho/i, /estoy interesad[oa]/i,
    ],
  },
];

/** Returns null if user has no comment data or contains offensive/harassing content */
export function classifyLead(comments: string[]): LeadStage | null {
  if (!comments || comments.length === 0) return null;
  if (isOffensive(comments)) return null;

  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) return group.stage;
    }
  }
  return "interesado";
}

export function getKeyAction(comments: string[]): string | null {
  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) {
        const matchedComment = comments.find((c) => pattern.test(c));
        if (matchedComment) return matchedComment;
      }
    }
  }
  return comments[0] ?? null;
}

export function getStageIndex(stage: LeadStage): number {
  return STAGE_ORDER.indexOf(stage);
}
