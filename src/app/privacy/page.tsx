import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — LiveLeads",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 sm:px-6 py-16 max-w-3xl mx-auto" style={{ backgroundColor: "#0b0f1a" }}>
      <Link href="/" className="text-sm text-[#fe2c55] hover:underline mb-8 inline-block">
        ← Volver
      </Link>
      <h1 className="text-3xl font-extrabold text-white/90 mt-4 mb-8">Política de Privacidad</h1>

      <div className="space-y-6 text-sm text-white/60 leading-relaxed">
        <p><strong className="text-white/80">Última actualización:</strong> Julio 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">1. Información que recopilamos</h2>
          <p>LiveLeads recopila la siguiente información cuando usas nuestros servicios:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Información de tu cuenta de Google (nombre, email, avatar) cuando inicias sesión</li>
            <li>Datos de transmisiones de TikTok Live que monitoreas (mensajes del chat, interacciones de usuarios)</li>
            <li>Información de uso del servicio para mejorar la experiencia</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">2. Cómo usamos tu información</h2>
          <p>Usamos la información recopilada para:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Proveer y mantener el servicio de monitoreo de TikTok Live</li>
            <li>Identificar leads y analizar patrones de compra en tiempo real</li>
            <li>Mejorar nuestros algoritmos de clasificación de intención de compra</li>
            <li>Comunicarnos contigo sobre el servicio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">3. Almacenamiento de datos</h2>
          <p>Los datos de tus transmisiones se almacenan de forma segura y se eliminan automáticamente después de 30 días. Puedes solicitar la eliminación de tus datos en cualquier momento.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">4. Compartir información</h2>
          <p>No compartimos tu información personal con terceros. Los datos agregados de transmisiones se usan únicamente para mejorar el servicio.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">5. Contacto</h2>
          <p>Para cualquier consulta sobre esta política, puedes contactarnos a través de nuestro repositorio en GitHub.</p>
        </section>
      </div>
    </main>
  );
}
