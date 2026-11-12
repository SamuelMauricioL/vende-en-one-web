import type { Locale } from "../i18n/translations";
import type { ContactRow } from "./contact";

/**
 * S2/S3 de `odd/tasks/landing-waitlist.md`: la copia de la landing de `/waitlist`.
 *
 * El español es **verbatim** de `landing/index.html` del demo (commit `d0320d8`)
 * y `content.test.ts` lo compara contra `demo-copy.ts`, que guarda el texto
 * visible de esa página y sus atributos (`alt`, `placeholder`, `aria-label`,
 * `data-title`, `data-cap`). Escribir acá una frase distinta, más corta o
 * "mejorada" rompe el test: la copia no se reescribe.
 *
 * Los títulos que el demo pinta con degradado van partidos en `title` +
 * `titleAccent` para que la palabra acentuada no se pierda.
 */

export interface WaitlistAnchor {
  label: string;
  href: string;
}

export interface WaitlistSlide {
  title: string;
  caption: string;
  /** `alt` de la captura: es copia, no decoración. */
  alt: string;
  src: string;
  width: number;
  height: number;
}

export interface WaitlistStep {
  tag: string;
  title: string;
  text: string;
}

/** Fila de la lista de permisos: la parte en negrita y lo que la sigue. */
export interface WaitlistPerm {
  positive: boolean;
  lead: string;
  /** Lo que sigue a la parte en negrita; la última fila no lo tiene. */
  text?: string;
}

export interface WaitlistField {
  label: string;
  placeholder: string;
}

export interface WaitlistLandingContent {
  /** Bloque 1: las 4 anclas del demo. La marca la pone el `Navbar` del sitio. */
  anchors: WaitlistAnchor[];
  /** Bloque 2. */
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    lead: string;
    primary: string;
    secondary: string;
    note: string;
  };
  /** Bloque 3: ventana de producto con las 3 capturas. */
  product: {
    label: string;
    pill: string;
    prev: string;
    next: string;
    dots: string;
    slides: WaitlistSlide[];
  };
  /** Bloque 4. */
  demo: {
    eyebrow: string;
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    note: string;
  };
  /** Bloque 5. */
  steps: {
    eyebrow: string;
    title: string;
    lead: string;
    items: WaitlistStep[];
  };
  /** Bloque 6. Las opciones de los selects viven en `lib/waitlist.ts`: son los
   * valores que viajan al API y no se traducen. */
  waitlist: {
    eyebrow: string;
    title: string;
    lead: string;
    fields: {
      email: WaitlistField;
      store: WaitlistField;
      tiktok: WaitlistField;
      category: WaitlistField;
      frequency: WaitlistField;
    };
    submit: string;
    submitting: string;
    invalid: string;
    failed: string;
    disclaimer: string;
    ok: { title: string; body: string };
  };
  /** Bloque 7. */
  tiktok: {
    eyebrow: string;
    title: string;
    lead: string;
    perms: WaitlistPerm[];
    primary: string;
    exit: string;
  };
  /** Bloque 8, primera parte. */
  faq: {
    eyebrow: string;
    title: string;
    items: { question: string; answer: string }[];
  };
  /** Bloque 8, segunda parte. */
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    copy: string;
    copied: string;
    copyFallback: string;
    chat: string;
    rows: ContactRow[];
  };
  /** Bloque 8, pie. El corazón es un `<svg>` con `aria-label`, como en el demo. */
  footer: {
    brand: string;
    madeWithLead: string;
    heartLabel: string;
    madeWithTail: string;
    links: WaitlistAnchor[];
  };
}

export const waitlistContent: Record<Locale, WaitlistLandingContent> = {
  es: {
    anchors: [
      { label: "Demo", href: "#demo" },
      { label: "Cómo funciona", href: "#como" },
      { label: "Preguntas", href: "#faq" },
      { label: "Unirme a la waitlist", href: "#waitlist" },
    ],
    hero: {
      eyebrow: "De la transmisión a la venta",
      title: "No pierdas oportunidades de venta en tus",
      titleAccent: "lives de TikTok",
      lead: "Mientras presentas, Live Leads lee el chat y separa a quien solo mira de quien pregunta el precio o quiere comprar. Cuando termina el live, tienes la lista de a quién escribirle.",
      primary: "Unirme a la waitlist",
      secondary: "Probar el demo",
      note: "Acceso por tandas · sin tarjeta",
    },
    product: {
      label: "Capturas del producto",
      pill: "Producto real",
      prev: "Captura anterior",
      next: "Captura siguiente",
      dots: "Elegir captura",
      slides: [
        {
          title: "Live Controller",
          caption: "Los leads aparecen en tiempo real mientras el chat avanza.",
          alt: "Live Controller con leads por intención y chat en vivo, junto al live de TikTok en el celular",
          src: "/landing/slide-live-controller.jpg",
          width: 1308,
          height: 746,
        },
        {
          title: "Filtros personalizados",
          caption:
            "Agrega las palabras clave de tu producto y cada mención cuenta como Negociando.",
          alt: "Pantalla de filtros personalizados con la palabra clave PS5 clasificada como Negociando",
          src: "/landing/slide-filtros.png",
          width: 1053,
          height: 667,
        },
        {
          title: "Historial",
          caption: "Cada live queda guardado, con un botón para escribirle al DM.",
          alt: "Historial de lives con los leads de cada sesión y el botón Escribirle al DM",
          src: "/landing/slide-historial.png",
          width: 1007,
          height: 653,
        },
      ],
    },
    demo: {
      eyebrow: "Demo",
      title: "Pruébalo con tu cuenta de TikTok",
      lead: "Ingresa el enlace de tu perfil, abre el Live Controller y empieza tu live. Los leads aparecen solos, ordenados por intención.",
      primary: "Abrir el demo",
      secondary: "Unirme a la waitlist",
      note: "tiktoklive.me/app · se abre en una pestaña nueva",
    },
    steps: {
      eyebrow: "Cómo funciona",
      title: "Tres pasos, antes y después del live",
      lead: "No cambias tu forma de transmitir. Live Leads corre al lado, en otra pestaña.",
      items: [
        {
          tag: "Antes del live",
          title: "Conecta tu cuenta",
          text: "Ingresas el enlace de tu perfil de TikTok y abres el panel. Cuando empiezas a transmitir, el chat empieza a llegar solo.",
        },
        {
          tag: "Durante el live",
          title: "Identifica prospectos",
          text: "Cada mensaje se clasifica por intención. Quien pregunta precio o pide el producto sube a la lista, sin que tengas que leer todo el chat.",
        },
        {
          tag: "Después del live",
          title: "Da seguimiento",
          text: "Cada sesión queda en tu historial, con lo que dijo cada persona y un botón para abrir su perfil y escribirle al DM.",
        },
      ],
    },
    waitlist: {
      eyebrow: "Waitlist",
      title: "Entra en la próxima tanda",
      lead: "Abrimos el acceso de a pocos vendedores para ajustar el producto con su feedback. Cuéntanos cómo vendes.",
      fields: {
        email: { label: "Correo", placeholder: "tu@correo.com" },
        store: { label: "Nombre de tu tienda", placeholder: "Ej: Esther Joyería" },
        tiktok: { label: "Usuario de TikTok", placeholder: "@tunickname" },
        category: { label: "Categoría", placeholder: "Elige una" },
        frequency: { label: "Lives por semana", placeholder: "Elige una" },
      },
      submit: "Unirme a la waitlist",
      submitting: "Enviando…",
      invalid:
        "Revisa el correo y tu usuario de TikTok (ej: @tunickname), y completa todos los campos.",
      failed:
        "No pudimos guardar tu registro. Inténtalo de nuevo o escríbenos por WhatsApp.",
      disclaimer: "Usamos estos datos solo para organizar el acceso. No los compartimos.",
      ok: { title: "Listo.", body: "Te escribiremos al correo cuando abramos tu tanda." },
    },
    tiktok: {
      eyebrow: "Demo con TikTok",
      title: "Pruébalo con tu propio live",
      lead: "Antes de conectar nada, esto es lo que necesita la prueba y lo que no hace.",
      perms: [
        {
          positive: true,
          lead: "Lee los mensajes públicos del chat",
          text: "de tu live mientras transmites.",
        },
        {
          positive: true,
          lead: "Guarda lo que dijo cada persona",
          text: "para tu historial de leads.",
        },
        {
          positive: false,
          lead: "No publica, no comenta y no envía DMs",
          text: "por ti. Tú decides a quién escribirle.",
        },
        { positive: false, lead: "No pide tu contraseña de TikTok." },
      ],
      primary: "Continuar con la prueba",
      exit: "Salir sin completar",
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Lo que conviene saber antes de entrar",
      items: [
        {
          question: "¿Cuándo puedo usarlo?",
          answer:
            "Estamos abriendo el acceso por tandas pequeñas. Quien se une a la waitlist recibe un correo cuando le toca. Si haces lives seguido, tienes prioridad para entrar.",
        },
        {
          question: "¿Qué datos míos y de mis espectadores se guardan?",
          answer:
            "Solo los mensajes públicos del chat de tus lives y el nombre visible de quien los escribió, para armar tu historial de leads. No pedimos tu contraseña de TikTok y no vendemos estos datos.",
        },
        {
          question: "¿Cómo decide si alguien quiere comprar?",
          answer:
            'Mira lo que escribe: frases como "lo quiero", preguntas de precio, envío o talla, y las palabras clave que tú agregas, por ejemplo el nombre de tu producto. Cada mensaje cae en Compra, Negociando o Interesado.',
        },
        {
          question: "¿Envía mensajes a mis espectadores por mí?",
          answer:
            "No. Live Leads te muestra a quién escribirle y abre su perfil de TikTok para que tú mismo mandes el DM. Así tu cuenta no corre el riesgo de que TikTok la limite por mensajes automáticos.",
        },
        {
          question: "¿Qué limitaciones tiene hoy?",
          answer:
            "La clasificación se puede equivocar con mensajes ambiguos o con jerga local, y por eso puedes agregar tus propias palabras clave. Además depende de que TikTok mantenga el chat del live accesible. Estamos en etapa temprana y te lo diremos si algo cambia.",
        },
        {
          question: "¿Cuánto cuesta?",
          answer:
            "Durante la waitlist no pagas nada. Los planes se definirán con los primeros vendedores, y quienes entren primero tendrán un precio especial.",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Hablemos de tus lives",
      lead: "Escríbenos si quieres probar el piloto, tienes una duda o vendes por TikTok Live y quieres contarnos cómo lo haces.",
      copy: "Copiar",
      copied: "Copiado",
      copyFallback: "Selecciona y copia",
      chat: "Abrir chat",
      rows: [
        { label: "Email", value: "tiktoklive.leads@gmail.com", action: "copy" },
        {
          label: "WhatsApp",
          value: "+51 934 000 821",
          action: "link",
          href: "https://wa.me/51934000821",
        },
        { label: "Teléfono", value: "+51 914 895 330", action: "copy" },
      ],
    },
    footer: {
      brand: "Team TikTok Live Leads",
      madeWithLead: "Hecho con",
      heartLabel: "amor",
      madeWithTail: "en Latam",
      links: [
        { label: "Contacto", href: "#contacto" },
        { label: "Volver arriba", href: "#top" },
      ],
    },
  },

  en: {
    anchors: [
      { label: "Demo", href: "#demo" },
      { label: "How it works", href: "#como" },
      { label: "Questions", href: "#faq" },
      { label: "Join the waitlist", href: "#waitlist" },
    ],
    hero: {
      eyebrow: "From livestream to sale",
      title: "Don't lose sales opportunities in your",
      titleAccent: "TikTok lives",
      lead: "While you present, Live Leads reads the chat and separates the people who are just watching from those asking the price or ready to buy. When the live ends, you have the list of who to write to.",
      primary: "Join the waitlist",
      secondary: "Try the demo",
      note: "Batch access · no card",
    },
    product: {
      label: "Product screenshots",
      pill: "Real product",
      prev: "Previous screenshot",
      next: "Next screenshot",
      dots: "Choose a screenshot",
      slides: [
        {
          title: "Live Controller",
          caption: "Leads show up in real time as the chat moves.",
          alt: "Live Controller with leads sorted by intent and a live chat, next to the TikTok live on the phone",
          src: "/landing/slide-live-controller.jpg",
          width: 1308,
          height: 746,
        },
        {
          title: "Custom filters",
          caption:
            "Add your product keywords and every mention counts as Negotiating.",
          alt: "Custom filters screen with the PS5 keyword classified as Negotiating",
          src: "/landing/slide-filtros.png",
          width: 1053,
          height: 667,
        },
        {
          title: "History",
          caption: "Every live is saved, with a button to write to their DM.",
          alt: "Live history with the leads of every session and the Write to their DM button",
          src: "/landing/slide-historial.png",
          width: 1007,
          height: 653,
        },
      ],
    },
    demo: {
      eyebrow: "Demo",
      title: "Try it with your TikTok account",
      lead: "Enter your profile link, open the Live Controller and start your live. Leads appear on their own, sorted by intent.",
      primary: "Open the demo",
      secondary: "Join the waitlist",
      note: "tiktoklive.me/app · opens in a new tab",
    },
    steps: {
      eyebrow: "How it works",
      title: "Three steps, before and after the live",
      lead: "You don't change how you stream. Live Leads runs alongside, in another tab.",
      items: [
        {
          tag: "Before the live",
          title: "Connect your account",
          text: "You enter your TikTok profile link and open the panel. When you start streaming, the chat starts arriving on its own.",
        },
        {
          tag: "During the live",
          title: "Identify prospects",
          text: "Every message is classified by intent. Whoever asks for the price or the product goes up the list, without you reading the whole chat.",
        },
        {
          tag: "After the live",
          title: "Follow up",
          text: "Every session stays in your history, with what each person said and a button to open their profile and write to their DM.",
        },
      ],
    },
    waitlist: {
      eyebrow: "Waitlist",
      title: "Join the next batch",
      lead: "We open access to a few sellers at a time so we can adjust the product with their feedback. Tell us how you sell.",
      fields: {
        email: { label: "Email", placeholder: "you@email.com" },
        store: { label: "Your store name", placeholder: "E.g. Esther Jewelry" },
        tiktok: { label: "TikTok username", placeholder: "@yournickname" },
        category: { label: "Category", placeholder: "Pick one" },
        frequency: { label: "Lives per week", placeholder: "Pick one" },
      },
      submit: "Join the waitlist",
      submitting: "Sending…",
      invalid:
        "Check your email and your TikTok username (e.g. @yournickname), and fill in every field.",
      failed: "We could not save your entry. Try again or message us on WhatsApp.",
      disclaimer: "We use this data only to organize access. We do not share it.",
      ok: { title: "Done.", body: "We will email you when your batch opens." },
    },
    tiktok: {
      eyebrow: "Demo with TikTok",
      title: "Try it with your own live",
      lead: "Before connecting anything, this is what the trial needs and what it does not do.",
      perms: [
        {
          positive: true,
          lead: "Reads the public chat messages",
          text: "of your live while you stream.",
        },
        { positive: true, lead: "Saves what each person said", text: "for your lead history." },
        {
          positive: false,
          lead: "Does not post, comment or send DMs",
          text: "for you. You decide who to write to.",
        },
        { positive: false, lead: "Does not ask for your TikTok password." },
      ],
      primary: "Continue with the trial",
      exit: "Leave without finishing",
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "What is worth knowing before you join",
      items: [
        {
          question: "When can I use it?",
          answer:
            "We are opening access in small batches. Whoever joins the waitlist gets an email when it is their turn. If you go live often, you have priority to get in.",
        },
        {
          question: "What data from me and my viewers is stored?",
          answer:
            "Only the public chat messages of your lives and the visible name of whoever wrote them, to build your lead history. We do not ask for your TikTok password and we do not sell this data.",
        },
        {
          question: "How does it decide whether someone wants to buy?",
          answer:
            'It looks at what they write: phrases like "I want it", price, shipping or size questions, and the keywords you add, for example your product name. Every message lands in Buying, Negotiating or Interested.',
        },
        {
          question: "Does it send messages to my viewers for me?",
          answer:
            "No. Live Leads shows you who to write to and opens their TikTok profile so you send the DM yourself. That way your account does not risk TikTok limiting it for automated messages.",
        },
        {
          question: "What limitations does it have today?",
          answer:
            "The classification can get ambiguous messages or local slang wrong, and that is why you can add your own keywords. It also depends on TikTok keeping the live chat accessible. We are at an early stage and we will tell you if something changes.",
        },
        {
          question: "How much does it cost?",
          answer:
            "During the waitlist you pay nothing. Plans will be defined with the first sellers, and whoever gets in first will have a special price.",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Let's talk about your lives",
      lead: "Write to us if you want to try the pilot, have a question, or sell on TikTok Live and want to tell us how you do it.",
      copy: "Copy",
      copied: "Copied",
      copyFallback: "Select and copy",
      chat: "Open chat",
      rows: [
        { label: "Email", value: "tiktoklive.leads@gmail.com", action: "copy" },
        {
          label: "WhatsApp",
          value: "+51 934 000 821",
          action: "link",
          href: "https://wa.me/51934000821",
        },
        { label: "Phone", value: "+51 914 895 330", action: "copy" },
      ],
    },
    footer: {
      brand: "Team TikTok Live Leads",
      madeWithLead: "Made with",
      heartLabel: "love",
      madeWithTail: "in Latam",
      links: [
        { label: "Contact", href: "#contacto" },
        { label: "Back to top", href: "#top" },
      ],
    },
  },
};
