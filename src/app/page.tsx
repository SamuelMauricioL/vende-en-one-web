import { LiveController } from "@/components/live-controller";

export default function Home() {
  return (
    <main className="flex-1 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-[880px]">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center font-extrabold text-[var(--bg)] shadow-lg shadow-[var(--brand)]/30">
              V1
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Vende en One · Live Controller
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Inicia y detén listeners de TikTok Live conectados a Convex.
              </p>
            </div>
          </div>
        </header>

        <LiveController />
      </div>
    </main>
  );
}
