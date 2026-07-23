import { LiveController } from "@/components/live-controller";

export default function Home() {
  return (
    <main className="flex-1 min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[960px]">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#fe2c55] to-[#25f4ee] flex items-center justify-center font-extrabold text-[#0b0f1a] shadow-lg shadow-[#fe2c55]/30 text-base">
              V1
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white/90">
                Vende en One
              </h1>
              <p className="text-xs text-white/40">
                Live Controller
              </p>
            </div>
          </div>
        </header>

        <LiveController />
      </div>
    </main>
  );
}
