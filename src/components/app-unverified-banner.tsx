"use client";

interface AppUnverifiedBannerProps {
  handle: string;
  onOpen: () => void;
}

export default function AppUnverifiedBanner({ handle, onOpen }: AppUnverifiedBannerProps) {
  return (
    <div
      className="border-b px-4 py-2 sm:px-6"
      style={{
        backgroundColor: "rgba(254,44,85,0.1)",
        borderColor: "rgba(254,44,85,0.25)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-white/65">
          Falta validar que{" "}
          <span className="font-semibold text-white/90">@{handle}</span> es tuya. Lo
          comprobamos con un código en la biografía de TikTok.
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="h-8 shrink-0 rounded-lg px-3 text-[11px] font-semibold text-white transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60"
          style={{ backgroundColor: "#fe2c55" }}
        >
          Validar mi cuenta
        </button>
      </div>
    </div>
  );
}
