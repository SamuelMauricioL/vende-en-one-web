import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos del Servicio — Live Leads",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 sm:px-6 py-16 max-w-3xl mx-auto" style={{ backgroundColor: "#0b0f1a" }}>
      <Link href="/" className="text-sm text-[#fe2c55] hover:underline mb-8 inline-block">
        ← Volver
      </Link>
      <h1 className="text-3xl font-extrabold text-white/90 mt-4 mb-8">Términos del Servicio</h1>

      <div className="space-y-6 text-sm text-white/60 leading-relaxed">
        <p><strong className="text-white/80">Última actualización:</strong> Julio 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">1. Aceptación de los términos</h2>
          <p>Al usar Live Leads, aceptas estos términos del servicio. Si no estás de acuerdo, no uses el servicio.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">2. Descripción del servicio</h2>
          <p>Live Leads es una herramienta que permite a creadores y vendedores monitorear transmisiones de TikTok Live para capturar y clasificar leads en tiempo real mediante análisis de inteligencia artificial.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">3. Uso responsable</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>No uses el servicio para acosar, spamear o molestar a usuarios de TikTok</li>
            <li>Respeta los términos de servicio de TikTok</li>
            <li>No intentes manipular o sobrecargar la infraestructura del servicio</li>
            <li>Eres responsable del uso que le des a los datos capturados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">4. Limitación de responsabilidad</h2>
          <p>Live Leads se proporciona &quot;tal cual&quot;. No garantizamos que el servicio sea ininterrumpido o libre de errores. No somos responsables por ventas perdidas o decisiones comerciales basadas en los datos proporcionados.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-2">5. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través del servicio.</p>
        </section>
      </div>
    </main>
  );
}
