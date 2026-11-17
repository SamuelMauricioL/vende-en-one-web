import type { Locale } from "../i18n/translations";

export type Rubric = "ropa" | "joyeria" | "tec" | "info";

export interface TemplateMessage {
  moment: string;
  text: string;
}

export const RUBRICS: Rubric[] = ["ropa", "joyeria", "tec", "info"];

export const kitTemplates: Record<Locale, Record<Rubric, TemplateMessage[]>> = {
  es: {
    ropa: [
      {
        moment: "Mismo día",
        text: "Hola {nombre}, soy {tienda}. En el live de hoy preguntaste por {prenda} en talla {talla}. Todavía la tengo. ¿Te la separo?",
      },
      {
        moment: "Al día siguiente",
        text: "Hola {nombre}, te escribo por la {prenda} que viste ayer. Te dejo una foto de cerca y cómo calza. ¿Quieres que te la reserve?",
      },
      {
        moment: "Cierre amable",
        text: "Hola {nombre}, no quiero molestarte. Si ya no te interesa la {prenda}, no hay problema. Cuando haga otro live te aviso por si te sirve algo más.",
      },
    ],
    joyeria: [
      {
        moment: "Mismo día",
        text: "Hola {nombre}, soy {tienda}. Hoy preguntaste por {pieza}. Te cuento de qué material es y cómo se cuida. ¿Quieres que te envíe fotos de cerca?",
      },
      {
        moment: "Al día siguiente",
        text: "Hola {nombre}, te escribo por {pieza}. Si la quieres para regalo, puedo mostrarte opciones de presentación. ¿Para qué ocasión la buscas?",
      },
      {
        moment: "Cierre amable",
        text: "Hola {nombre}, gracias por pasar por el live. Si más adelante quieres {pieza} u otra pieza, escríbeme y te muestro lo que tenga disponible.",
      },
    ],
    tec: [
      {
        moment: "Mismo día",
        text: "Hola {nombre}, soy {tienda}. En el live preguntaste cómo funciona {producto}. Te resumo lo básico: {dato}. ¿Quieres que te lo muestre en el próximo live?",
      },
      {
        moment: "Al día siguiente",
        text: "Hola {nombre}, sobre {producto}: te dejo lo que incluye la caja y la garantía que ofrezco. ¿Te queda alguna duda antes de decidir?",
      },
      {
        moment: "Cierre amable",
        text: "Hola {nombre}, si todavía estás comparando {producto}, dime qué te falta saber y te lo respondo. Sin presión.",
      },
    ],
    info: [
      {
        moment: "Mismo día",
        text: "Hola {nombre}, soy {tienda}. En el live te interesó {programa}. Te cuento qué incluye y para quién sirve. Si te hace sentido, te explico cómo acceder.",
      },
      {
        moment: "Al día siguiente",
        text: "Hola {nombre}, te escribo por {programa}. Te comparto el temario y una muestra de lo que aprenderás. ¿Qué te gustaría lograr con esto?",
      },
      {
        moment: "Cierre amable",
        text: "Hola {nombre}, no quiero insistir. Si {programa} no es para ti ahora, avísame y te aviso de la próxima edición.",
      },
    ],
  },

  en: {
    ropa: [
      {
        moment: "Same day",
        text: "Hi {nombre}, this is {tienda}. During today's live you asked about {prenda} in size {talla}. I still have it. Should I set it aside for you?",
      },
      {
        moment: "The next day",
        text: "Hi {nombre}, I'm writing about the {prenda} you saw yesterday. Here is a close-up photo and how it fits. Do you want me to hold it for you?",
      },
      {
        moment: "Friendly close",
        text: "Hi {nombre}, I don't want to bother you. If you're no longer interested in the {prenda}, no problem. When I go live again I'll let you know in case something else works for you.",
      },
    ],
    joyeria: [
      {
        moment: "Same day",
        text: "Hi {nombre}, this is {tienda}. Today you asked about {pieza}. Let me tell you what material it is and how to care for it. Want me to send close-up photos?",
      },
      {
        moment: "The next day",
        text: "Hi {nombre}, I'm writing about {pieza}. If it's a gift, I can show you presentation options. What occasion is it for?",
      },
      {
        moment: "Friendly close",
        text: "Hi {nombre}, thanks for stopping by the live. If later you want {pieza} or another piece, write to me and I'll show you what I have available.",
      },
    ],
    tec: [
      {
        moment: "Same day",
        text: "Hi {nombre}, this is {tienda}. In the live you asked how {producto} works. Here is the basics: {dato}. Want me to show it in the next live?",
      },
      {
        moment: "The next day",
        text: "Hi {nombre}, about {producto}: here is what comes in the box and the warranty I offer. Any doubt left before you decide?",
      },
      {
        moment: "Friendly close",
        text: "Hi {nombre}, if you're still comparing {producto}, tell me what you still need to know and I'll answer. No pressure.",
      },
    ],
    info: [
      {
        moment: "Same day",
        text: "Hi {nombre}, this is {tienda}. In the live you were interested in {programa}. Let me tell you what it includes and who it's for. If it makes sense, I'll explain how to join.",
      },
      {
        moment: "The next day",
        text: "Hi {nombre}, I'm writing about {programa}. Here is the syllabus and a sample of what you'll learn. What would you like to achieve with it?",
      },
      {
        moment: "Friendly close",
        text: "Hi {nombre}, I don't want to insist. If {programa} isn't for you right now, let me know and I'll tell you about the next edition.",
      },
    ],
  },
};

export interface TextSegment {
  value: string;
  isVariable: boolean;
}

export function splitVariables(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /\{[^}]+\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ value: text.slice(last, match.index), isVariable: false });
    }
    segments.push({ value: match[0], isVariable: true });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ value: text.slice(last), isVariable: false });
  }

  return segments;
}
