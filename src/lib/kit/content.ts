import type { Locale } from "../i18n/translations";

export interface ChecklistItem {

  label?: string;
  text: string;
}

export interface Checklist {
  title: string;
  items: ChecklistItem[];
}

export interface Advice {
  label: string;
  text: string;
}

export interface KitSection {
  eyebrow: string;
  title: string;
  intro: string;
  checklist?: Checklist;
  advice?: Advice;
}

export interface KitContent {
  header: { brand: string; tagline: string };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    lead: string;
    chips: string[];
  };
  form: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    tiktok: string;
    tiktokPlaceholder: string;
    category: string;
    categories: string[];
    submit: string;
    ok: string;
    privacy: string;
    status: { submitting: string; invalidEmail: string; invalidTiktok: string; failed: string };
  };
  toc: { title: string; items: string[] };
  sections: {
    before: KitSection & { compare?: never };
    hook: KitSection & { compare: { avoidLabel: string; avoid: string; doLabel: string; do: string } };
    offer: KitSection;
    during: KitSection;
    after: KitSection;
  };
  liveLeads: {
    warnTitle: string;
    warnAccent: string;
    badge: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    steps: { title: string; text: string }[];
    board: {
      label: string;
      live: string;
      count: string;
      rows: { user: string; text: string; tag: string }[];
      cta: string;
      note: string;
    };
    limits: { does: Advice; doesNot: Advice };
  };
  videos: {
    title: string;
    titleAccent: string;
    subtitle: string;
    label: string;
    prev: string;
    next: string;
    items: { title: string; caption: string }[];
    cta: string;
  };
  templates: {
    eyebrow: string;
    title: string;
    introLead: string;
    introAccent: string;
    introTail: string;
    lockedTitle: string;
    lockedText: string;
    lockedCta: string;
    tabs: string[];
    copy: string;
    copied: string;
    copyFallback: string;
  };
  faq: { title: string; items: { question: string; answer: string }[] };
  final: { eyebrow: string; title: string; titleAccent: string; lead: string; cta: string };
  footer: string;
}

export const kitContent: Record<Locale, KitContent> = {
  es: {
    header: {
      brand: "LiveLeads",
      tagline: "Recurso gratuito · Guía del vendedor en vivo",
    },
    hero: {
      eyebrow: "Para vendedores de TikTok Live",
      title: "Kit",
      titleAccent: "Live sin improvisar",
      lead: "Un checklist para antes, durante y después de tu live, más mensajes de seguimiento para escribirles a los que preguntaron y no compraron. Hecho para vendedores que ya transmiten y quieren dejar de depender de la memoria.",
      chips: [
        "Checklist en 3 momentos",
        "12 mensajes por rubro",
        "Ropa · Joyería · Tecnología · Infoproductos",
      ],
    },
    form: {
      title: "Recibe el kit completo",
      subtitle: "Desbloquea los mensajes de seguimiento y te avisamos cuando haya una nueva guía.",
      email: "Correo",
      emailPlaceholder: "tucorreo@ejemplo.com",
      tiktok: "Tu usuario de TikTok",
      tiktokPlaceholder: "@tutienda",
      category: "¿Qué vendes?",
      categories: ["Ropa", "Joyería y accesorios", "Tecnología", "Infoproductos", "Otro"],
      submit: "Desbloquear el kit",
      ok: "Listo: los mensajes ya están desbloqueados más abajo.",
      privacy:
        "Usamos tus datos solo para enviarte el kit y novedades de Live Leads. Puedes pedir que los borremos escribiendo a tiktoklive.leads@gmail.com.",
      status: {
        submitting: "Enviando…",
        invalidEmail: "Revisa tu correo y vuelve a intentar.",
        invalidTiktok: "Revisa tu usuario de TikTok: solo letras, números, punto y guion bajo, hasta 24 caracteres.",
        failed: "No pudimos guardar tu correo. Inténtalo de nuevo o escríbenos por WhatsApp.",
      },
    },
    toc: {
      title: "Cubriremos",
      items: [
        "¿Qué dejo listo antes de entrar en vivo?",
        "¿Cómo engancho desde el primer minuto?",
        "¿Cómo armo una oferta que se entienda?",
        "¿Cómo no perder ventas durante el live?",
        "¿Qué hago cuando el live termina?",
        "¿Qué le escribo a cada lead?",
      ],
    },
    sections: {
      before: {
        eyebrow: "Antes del live",
        title: "¿Qué dejo listo antes de entrar en vivo?",
        intro:
          "Si no puedes responder qué material es, cómo se usa o cuánto cuesta sin dudar, todavía no estás listo para transmitir. Marca cada punto; tu avance se guarda en este navegador.",
        checklist: {
          title: "Preparación",
          items: [
            { text: "Usé o probé el producto yo mismo y sé cómo funciona." },
            { text: "Tengo a mano material, medidas, tallas o contenido de cada producto." },
            { text: "Escribí las 3 preguntas que más me hacen y su respuesta." },
            {
              text: "Definí mis ofertas del día: pack, precio solo por live o cantidad limitada real.",
            },
            { text: "Probé luz, audio y conexión antes de iniciar." },
            {
              text: "Revisé las normas vigentes de TikTok LIVE y los ajustes de contenido de mi cuenta.",
            },
          ],
        },
        advice: {
          label: "Consejo:",
          text: "si alguien te ayuda a responder preguntas mientras tú transmites, el live fluye mejor. Si estás solo, deja las respuestas escritas donde las veas.",
        },
      },
      hook: {
        eyebrow: "Durante el live",
        title: "¿Cómo engancho desde el primer minuto?",
        intro:
          "No esperes a tener mucha gente conectada para empezar. Empieza mostrando el producto: así quien entra ve algo desde el primer segundo.",
        compare: {
          avoidLabel: "Evita",
          avoid:
            "“Hola chicos, ¿cómo están? Compartan, denle a la pantalla…” mientras esperas que se llene el live.",
          doLabel: "Haz esto",
          do: "Muestra el producto de inmediato: qué es, de qué material, cómo se usa y cómo funciona.",
        },
        advice: { label: "Después del gancho,", text: "presenta la oferta. Primero interés, luego precio." },
      },
      offer: {
        eyebrow: "Durante el live",
        title: "¿Cómo armo una oferta que se entienda?",
        intro:
          "Tres formas que puedes combinar. Que quede claro por qué conviene comprar durante el live.",
        checklist: {
          title: "Ofertas posibles",
          items: [
            {
              label: "Pack:",
              text: "suma algo que complementa, por ejemplo unas plantillas o medias a un par de zapatillas.",
            },
            {
              label: "Precio solo por live:",
              text: "un precio distinto al de tu catálogo, que dices en voz alta y repites.",
            },
            {
              label: "Cantidad limitada real:",
              text: "avisa cuántas unidades quedan solo si es verdad.",
            },
          ],
        },
        advice: {
          label: "Ojo:",
          text: "no inventes escasez. Si dices “últimas unidades” y no es cierto, pierdes la confianza de quien te compró y de quien te vio.",
        },
      },
      during: {
        eyebrow: "Durante el live",
        title: "¿Cómo no perder ventas durante el live?",
        intro:
          "El chat avanza más rápido de lo que puedes leer. Quien preguntó el precio o dijo “lo quiero” queda enterrado entre cientos de mensajes. Mientras vendes, marca a quien preguntó para escribirle después.",
        checklist: {
          title: "Mientras transmites",
          items: [
            { text: "Repito cada pocos minutos el precio y cómo comprar." },
            { text: "Nombro a quien pregunta para que se sienta atendido." },
            { text: "Respondo lo que puedo en vivo y anoto quién quedó pendiente." },
            { text: "Muestro un producto a la vez, sin saltar entre varios." },
            { text: "No cierro el live sin repetir la oferta una última vez." },
          ],
        },
      },
      after: {
        eyebrow: "Después del live",
        title: "¿Qué hago cuando el live termina?",
        intro:
          "La conversación no termina con el live. Escribe el mismo día, mientras el producto sigue fresco en la cabeza del cliente. Tú envías cada mensaje, uno por uno: no automatices los DMs ni escribas a quien no te preguntó nada.",
        checklist: {
          title: "Seguimiento",
          items: [
            { text: "Reviso la lista de quienes preguntaron o dijeron que querían comprar." },
            { text: "Empiezo por quienes dijeron “lo quiero” o pidieron talla o precio." },
            { text: "Escribo cada mensaje a mano, con su nombre y lo que preguntó." },
            { text: "Si no responde, hago un segundo intento al día siguiente y paro ahí." },
            { text: "Anoto qué pregunta se repitió para prepararla en el próximo live." },
          ],
        },
      },
    },
    liveLeads: {
      warnTitle: "PARA QUE NO TE PASE ESTO...",
      warnAccent: "USA LIVE LEADS",
      badge: "Con Live Leads",
      title: "Alguien que lee el chat",
      titleAccent: "mientras tú vendes",
      subtitle:
        "Live Leads lee el chat de tu live y clasifica a cada espectador por intención: Compra, Negociando o Interesado. Tú sigues mostrando producto. Cuando puedas, ves a quién escribirle y abres su perfil de TikTok con un clic.",
      steps: [
        {
          title: "Conectas tu perfil",
          text: "Ingresas el enlace de tu perfil de TikTok en el demo.",
        },
        {
          title: "El chat se ordena",
          text: "Cada espectador queda en una etiqueta según lo que escribió. Puedes agregar tus propias palabras clave.",
        },
        {
          title: "Tú escribes el DM",
          text: "Abres su perfil y le escribes tú, con el historial del live guardado.",
        },
      ],
      board: {
        label: "Ejemplo ilustrativo de leads ordenados por intención",
        live: "En vivo",
        count: "3 leads detectados",
        rows: [
          { user: "@cliente1.ejemplo", text: "“lo quiero, ¿cómo pago?”", tag: "Compra" },
          { user: "@cliente2.ejemplo", text: "“¿me haces precio por dos?”", tag: "Negociando" },
          { user: "@cliente3.ejemplo", text: "“¿tienes en talla M?”", tag: "Interesado" },
        ],
        cta: "Abrir perfil de TikTok →",
        note: "Datos y mensajes de ejemplo, no son personas reales. La clasificación se basa en palabras clave y puede equivocarse con mensajes ambiguos o jerga local.",
      },
      limits: {
        does: {
          label: "Qué hace:",
          text: "ordena el chat por intención, guarda el historial de cada live y abre el perfil del lead.",
        },
        doesNot: {
          label: "Qué no hace:",
          text: "no envía mensajes por ti, no te pide la contraseña de TikTok y no es una herramienta oficial de TikTok.",
        },
      },
    },
    videos: {
      title: "Ve cómo funciona",
      titleAccent: "LiveLeads",
      subtitle:
        "Dos recorridos cortos con datos de ejemplo. Activa el sonido para escuchar la explicación.",
      label: "Videos de Live Leads",
      prev: "Video anterior",
      next: "Video siguiente",
      items: [
        { title: "Live Controller", caption: "Ordena el chat por intención mientras vendes · 20 s" },
        { title: "Bandeja de rescate", caption: "Retoma tus leads después del live · 29 s" },
      ],
      cta: "Prueba el demo",
    },
    templates: {
      eyebrow: "Mensajes de seguimiento",
      title: "¿Qué le escribo a cada lead?",
      introLead: "Cuatro rubros, tres momentos cada uno. Cambia lo que está en ",
      introAccent: "color",
      introTail: " y envíalo desde tu cuenta, como lo harías normalmente.",
      lockedTitle: "Desbloquea los 12 mensajes",
      lockedText: "Déjanos tu correo y los ves aquí mismo.",
      lockedCta: "Ir al formulario",
      tabs: ["Ropa", "Joyería", "Tecnología", "Infoproductos"],
      copy: "Copiar",
      copied: "Copiado",
      copyFallback: "Selecciona y copia",
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Live Leads envía los mensajes por mí?",
          answer:
            "No. Live Leads te muestra a quién escribirle y abre su perfil de TikTok. El mensaje lo escribes y lo envías tú.",
        },
        {
          question: "¿Necesito Live Leads para usar este kit?",
          answer:
            "No. El checklist y los mensajes funcionan solos. Live Leads es una ayuda para encontrar rápido a los que preguntaron.",
        },
        {
          question: "¿Live Leads es una herramienta oficial de TikTok?",
          answer: "No. Es una herramienta independiente para vendedores de TikTok Live.",
        },
        {
          question: "¿Tiene costo?",
          answer:
            "El kit es gratis. Del producto estamos en piloto con acceso por tandas; los precios se definen con los primeros vendedores.",
        },
      ],
    },
    final: {
      eyebrow: "Siguiente paso",
      title: "Prueba cómo se",
      titleAccent: "ordenan tus leads",
      lead: "Conecta tu perfil en el demo y mira el chat de tu live clasificado en Compra, Negociando e Interesado.",
      cta: "Prueba el demo",
    },
    footer: "Live Leads · tiktoklive.leads@gmail.com · WhatsApp +51 934 000 821",
  },

  en: {
    header: {
      brand: "LiveLeads",
      tagline: "Free resource · A live seller's guide",
    },
    hero: {
      eyebrow: "For TikTok Live sellers",
      title: "Kit",
      titleAccent: "to go live without improvising",
      lead: "A checklist for before, during and after your live, plus follow-up messages to write to the people who asked and did not buy. Made for sellers who already go live and want to stop relying on memory.",
      chips: [
        "Checklist in 3 moments",
        "12 messages per category",
        "Clothing · Jewelry · Tech · Digital products",
      ],
    },
    form: {
      title: "Get the full kit",
      subtitle: "Unlock the follow-up messages and we will tell you when a new guide is out.",
      email: "Email",
      emailPlaceholder: "youremail@example.com",
      tiktok: "Your TikTok username",
      tiktokPlaceholder: "@yourshop",
      category: "What do you sell?",
      categories: ["Clothing", "Jewelry and accessories", "Tech", "Digital products", "Other"],
      submit: "Unlock the kit",
      ok: "Done: the messages are unlocked below.",
      privacy:
        "We use your data only to send you the kit and Live Leads news. You can ask us to delete it by writing to tiktoklive.leads@gmail.com.",
      status: {
        submitting: "Sending…",
        invalidEmail: "Check your email and try again.",
        invalidTiktok: "Check your TikTok username: only letters, numbers, dot and underscore, up to 24 characters.",
        failed: "We could not save your email. Try again or message us on WhatsApp.",
      },
    },
    toc: {
      title: "What we will cover",
      items: [
        "What do I get ready before going live?",
        "How do I hook people from the first minute?",
        "How do I build an offer people understand?",
        "How do I stop losing sales during the live?",
        "What do I do when the live ends?",
        "What do I write to each lead?",
      ],
    },
    sections: {
      before: {
        eyebrow: "Before the live",
        title: "What do I get ready before going live?",
        intro:
          "If you cannot say what the material is, how it is used or how much it costs without hesitating, you are not ready to go live yet. Tick every point; your progress is saved in this browser.",
        checklist: {
          title: "Preparation",
          items: [
            { text: "I used or tested the product myself and I know how it works." },
            { text: "I have the material, measurements, sizes or content for each product at hand." },
            { text: "I wrote down the 3 questions I get asked most, with their answers." },
            {
              text: "I defined my offers for the day: bundle, live-only price or a real limited quantity.",
            },
            { text: "I tested light, audio and connection before starting." },
            {
              text: "I checked the current TikTok LIVE rules and the content settings of my account.",
            },
          ],
        },
        advice: {
          label: "Tip:",
          text: "if someone helps you answer questions while you are live, it flows better. If you are alone, leave the answers written where you can see them.",
        },
      },
      hook: {
        eyebrow: "During the live",
        title: "How do I hook people from the first minute?",
        intro:
          "Do not wait for a big audience to start. Start by showing the product: whoever walks in sees something from the first second.",
        compare: {
          avoidLabel: "Avoid",
          avoid:
            "“Hi guys, how are you? Share it, tap the screen…” while you wait for the live to fill up.",
          doLabel: "Do this",
          do: "Show the product right away: what it is, what material, how it is used and how it works.",
        },
        advice: { label: "After the hook,", text: "present the offer. Interest first, price second." },
      },
      offer: {
        eyebrow: "During the live",
        title: "How do I build an offer people understand?",
        intro: "Three ways you can combine. Make it clear why buying during the live is worth it.",
        checklist: {
          title: "Possible offers",
          items: [
            {
              label: "Bundle:",
              text: "add something that complements it, for example insoles or socks with a pair of sneakers.",
            },
            {
              label: "Live-only price:",
              text: "a price different from your catalog, which you say out loud and repeat.",
            },
            {
              label: "Real limited quantity:",
              text: "say how many units are left only if it is true.",
            },
          ],
        },
        advice: {
          label: "Careful:",
          text: "do not invent scarcity. If you say “last units” and it is not true, you lose the trust of the people who bought from you and of the people watching.",
        },
      },
      during: {
        eyebrow: "During the live",
        title: "How do I stop losing sales during the live?",
        intro:
          "The chat moves faster than you can read. Whoever asked the price or said “I want it” gets buried under hundreds of messages. While you sell, mark whoever asked so you can write to them later.",
        checklist: {
          title: "While you are live",
          items: [
            { text: "I repeat the price and how to buy every few minutes." },
            { text: "I name whoever asks so they feel attended to." },
            { text: "I answer what I can live and note who is still waiting." },
            { text: "I show one product at a time, without jumping between several." },
            { text: "I do not close the live without repeating the offer one last time." },
          ],
        },
      },
      after: {
        eyebrow: "After the live",
        title: "What do I do when the live ends?",
        intro:
          "The conversation does not end with the live. Write the same day, while the product is still fresh in the customer's head. You send every message, one by one: do not automate DMs and do not write to anyone who did not ask you anything.",
        checklist: {
          title: "Follow-up",
          items: [
            { text: "I review the list of people who asked or said they wanted to buy." },
            { text: "I start with those who said “I want it” or asked for a size or a price." },
            { text: "I write every message by hand, with their name and what they asked." },
            { text: "If there is no answer, I try once more the next day and stop there." },
            { text: "I note which question kept repeating so I can prepare it for the next live." },
          ],
        },
      },
    },
    liveLeads: {
      warnTitle: "SO THIS DOES NOT HAPPEN TO YOU...",
      warnAccent: "USE LIVE LEADS",
      badge: "With Live Leads",
      title: "Someone reading the chat",
      titleAccent: "while you sell",
      subtitle:
        "Live Leads reads your live chat and classifies every viewer by intent: Buying, Negotiating or Interested. You keep showing product. When you can, you see who to write to and open their TikTok profile with one click.",
      steps: [
        { title: "You connect your profile", text: "You enter your TikTok profile link in the demo." },
        {
          title: "The chat is sorted",
          text: "Every viewer lands in a tag based on what they wrote. You can add your own keywords.",
        },
        {
          title: "You write the DM",
          text: "You open their profile and write to them yourself, with the live history saved.",
        },
      ],
      board: {
        label: "Illustrative example of leads sorted by intent",
        live: "Live",
        count: "3 leads detected",
        rows: [
          { user: "@cliente1.ejemplo", text: "“i want it, how do i pay?”", tag: "Buying" },
          { user: "@cliente2.ejemplo", text: "“can you do a price for two?”", tag: "Negotiating" },
          { user: "@cliente3.ejemplo", text: "“do you have size M?”", tag: "Interested" },
        ],
        cta: "Open TikTok profile →",
        note: "Sample data and messages, these are not real people. Classification is based on keywords and can be wrong with ambiguous messages or local slang.",
      },
      limits: {
        does: {
          label: "What it does:",
          text: "sorts the chat by intent, keeps the history of every live and opens the lead's profile.",
        },
        doesNot: {
          label: "What it does not do:",
          text: "it does not send messages for you, it does not ask for your TikTok password and it is not an official TikTok tool.",
        },
      },
    },
    videos: {
      title: "See how",
      titleAccent: "LiveLeads works",
      subtitle: "Two short walkthroughs with sample data. Turn the sound on to hear the explanation.",
      label: "Live Leads videos",
      prev: "Previous video",
      next: "Next video",
      items: [
        { title: "Live Controller", caption: "Sorts the chat by intent while you sell · 20 s" },
        { title: "Rescue inbox", caption: "Pick your leads back up after the live · 29 s" },
      ],
      cta: "Try the demo",
    },
    templates: {
      eyebrow: "Follow-up messages",
      title: "What do I write to each lead?",
      introLead: "Four categories, three moments each. Change what is in ",
      introAccent: "color",
      introTail: " and send it from your account, the way you normally would.",
      lockedTitle: "Unlock the 12 messages",
      lockedText: "Leave us your email and you will see them right here.",
      lockedCta: "Go to the form",
      tabs: ["Clothing", "Jewelry", "Tech", "Digital products"],
      copy: "Copy",
      copied: "Copied",
      copyFallback: "Select and copy",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          question: "Does Live Leads send the messages for me?",
          answer:
            "No. Live Leads shows you who to write to and opens their TikTok profile. You write and send the message.",
        },
        {
          question: "Do I need Live Leads to use this kit?",
          answer:
            "No. The checklist and the messages work on their own. Live Leads is a help to find the people who asked quickly.",
        },
        {
          question: "Is Live Leads an official TikTok tool?",
          answer: "No. It is an independent tool for TikTok Live sellers.",
        },
        {
          question: "Does it cost anything?",
          answer:
            "The kit is free. The product is in a pilot with access in batches; prices are set with the first sellers.",
        },
      ],
    },
    final: {
      eyebrow: "Next step",
      title: "See how your",
      titleAccent: "leads get sorted",
      lead: "Connect your profile in the demo and watch your live chat classified into Buying, Negotiating and Interested.",
      cta: "Try the demo",
    },
    footer: "Live Leads · tiktoklive.leads@gmail.com · WhatsApp +51 934 000 821",
  },
};
