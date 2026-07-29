export type TranslationKey = keyof typeof es;

export type Locale = "es" | "en";

export const es = {
  // Nav
  "nav.demo": "Demo",
  "nav.features": "Features",
  "nav.live": "Live Controller",

  // Hero
  "hero.badge": "Captura leads de tu TikTok Live",
  "hero.headline.start": "Deja de perder",
  "hero.headline.end": "en tu TikTok Live",
  "hero.words.0": "clientes",
  "hero.words.1": "ventas",
  "hero.words.2": "oportunidades",
  "hero.words.3": "seguimiento",
  "hero.words.4": "dinero",
  "hero.subtitle":
    "Cada minuto que pasa, pierdes clientes en el chat. Nuestra IA detecta a los que quieren comprar con un 90% de precisión. Cuando el live termina, sus datos se quedan contigo.",
  "hero.cta.try": "Probar Live Controller",
  "hero.cta.watch": "Ver cómo funciona",
  "hero.social": "+50 vendedores ya no pierden ventas en vivo",
  "hero.scroll": "Descubre",

  // Funnel
  "funnel.badge": "De la transmisión a la venta",
  "funnel.title": "La realidad de vender en TikTok Live",
  "funnel.subtitle":
    "De 100 espectadores, solo 3 te compran. El resto se pierde en el chat.",
  "funnel.stage.0": "Espectadores del Live",
  "funnel.stage.1": "Interesados",
  "funnel.stage.2": "Preguntan precio",
  "funnel.stage.3": "Te escriben DM",
  "funnel.stage.4": "Venta asegurada",
  "funnel.pct.0": "100%",
  "funnel.pct.1": "40%",
  "funnel.pct.2": "18%",
  "funnel.pct.3": "8%",
  "funnel.pct.4": "3%",
  "funnel.bottom":
    "Solo unos cuantos te compran. Los demás se pierden entre mensajes. Pero con Live Leads, los recuperas después del live.",

  // Video
  "video.title": "Así funciona en vivo",
  "video.subtitle":
    "Conecta tu TikTok Live, y nosotros nos encargamos del resto.",
  "video.placeholder": "Video demo próximamente",
  "video.hint": "Reemplaza con tu video MP4 en VideoSection",
  "video.caption":
    "Demo automática — mira cómo los leads fluyen del Live a tu Dashboard en tiempo real",
  "chat.watching": "viendo",

  // Features
  "features.title": "Todo lo que necesitas",
  "features.subtitle": "De la transmisión a la venta, en un solo lugar.",
  "features.0.title": "Conexión directa al Live",
  "features.0.desc":
    "Conecta tu TikTok Live en un clic. Escuchamos cada comentario, like y regalo en tiempo real.",
  "features.1.title": "Captura automática",
  "features.1.desc":
    "Cada persona que interactúa se registra automáticamente. Nunca más pierdas un lead porque el chat avanzó muy rápido.",
  "features.2.title": "Filtro IA de compradores",
  "features.2.desc":
    "Nuestro algoritmo analiza el comportamiento en vivo y asigna probabilidad de compra. Solo los leads calientes llegan a tu bandeja.",
  "features.4.title": "Métricas en tiempo real",
  "features.4.desc":
    "Ve cuántos leads capturaste, cuántos están calificados y cuántos convirtieron. Todo en vivo.",
  "features.5.title": "Sin fricción",
  "features.5.desc":
    "No necesitas ser técnico. Conectas tu live y empiezas a capturar leads al instante.",
  "features.6.title": "Post-live: recupera ventas",
  "features.6.desc":
    "Lo que no vendiste en el live, véndelo después. Captura sus datos, escríbeles y cierra la venta cuando termine la transmisión.",

  // CTA
  "cta.title": "No pierdas ventas. Ni en el live, ni después.",
  "cta.subtitle":
    "Captura leads durante la transmisión. Cuando termine el live, te quedas con los datos de los que querían comprar. Lo que no vendiste hoy, lo vendes mañana.",
  "cta.button": "Ir al Live Controller",
  "cta.secondary": "Ver features",
  "cta.stat.creators": "Vendedores activos",
  "cta.stat.precision": "Precisión IA",
  "cta.stat.setup": "En configurar",

  // Footer
  "footer.tagline": "Hecho para creadores que venden en vivo — Live Leads",
} as const;

export const en: Record<TranslationKey, string> = {
  // Nav
  "nav.demo": "Demo",
  "nav.features": "Features",
  "nav.live": "Live Controller",

  // Hero
  "hero.badge": "Capture leads from your TikTok Live",
  "hero.headline.start": "Stop losing",
  "hero.headline.end": "in your TikTok Live",
  "hero.words.0": "customers",
  "hero.words.1": "sales",
  "hero.words.2": "opportunities",
  "hero.words.3": "follow-ups",
  "hero.words.4": "money",
  "hero.subtitle":
    "Every minute that passes, you're losing customers in the chat. Our AI detects real buyers with 90% accuracy. When the live ends, their data stays with you.",
  "hero.cta.try": "Try Live Controller",
  "hero.cta.watch": "See how it works",
  "hero.social": "+50 sellers no longer lose live sales",
  "hero.scroll": "Discover",

  // Funnel
  "funnel.badge": "From stream to sale",
  "funnel.title": "The reality of selling on TikTok Live",
  "funnel.subtitle":
    "Out of 100 viewers, only 3 will buy. The rest get lost in chat.",
  "funnel.stage.0": "Live Viewers",
  "funnel.stage.1": "Engaged",
  "funnel.stage.2": "Ask price",
  "funnel.stage.3": "Send DM",
  "funnel.stage.4": "Guaranteed Sale",
  "funnel.pct.0": "100%",
  "funnel.pct.1": "40%",
  "funnel.pct.2": "18%",
  "funnel.pct.3": "8%",
  "funnel.pct.4": "3%",
  "funnel.bottom":
    "Only a few will buy. The rest get buried in the chat. But with Live Leads, you recover them after the live.",

  // Video
  "video.title": "How it works live",
  "video.subtitle":
    "Connect your TikTok Live, and we take care of the rest.",
  "video.placeholder": "Demo video coming soon",
  "video.hint": "Replace with your MP4 video in VideoSection",
  "video.caption":
    "Auto demo — watch leads flow from Live to your Dashboard in real time",
  "chat.watching": "watching",

  // Features
  "features.title": "Everything you need",
  "features.subtitle": "From stream to sale, all in one place.",
  "features.0.title": "One-click live connection",
  "features.0.desc":
    "Connect your TikTok Live in one click. We listen to every comment, like, and gift in real time.",
  "features.1.title": "Auto capture",
  "features.1.desc":
    "Every person who interacts is automatically logged. Never lose a lead because the chat scrolled too fast.",
  "features.2.title": "AI buyer filter",
  "features.2.desc":
    "Our algorithm analyzes live behavior and assigns a purchase probability. Only hot leads reach your inbox.",
  "features.4.title": "Real-time metrics",
  "features.4.desc":
    "See how many leads you captured, how many are qualified, and how many converted. All live.",
  "features.5.title": "Zero friction",
  "features.5.desc":
    "No technical skills needed. Connect your live and start capturing leads instantly.",
  "features.6.title": "Post-live: recover sales",
  "features.6.desc":
    "What you didn't sell during the live, sell it after. Capture their data, message them, and close the sale after the stream ends.",

  // CTA
  "cta.title": "Don't lose sales. Not during the live, not after.",
  "cta.subtitle":
    "Capture leads during the stream. When the live ends, you keep the data of everyone who wanted to buy. What you don't sell today, you sell tomorrow.",
  "cta.button": "Go to Live Controller",
  "cta.secondary": "View features",
  "cta.stat.creators": "Active sellers",
  "cta.stat.precision": "AI Precision",
  "cta.stat.setup": "To set up",

  // Footer
  "footer.tagline": "Made for creators who sell live — Live Leads",
};
