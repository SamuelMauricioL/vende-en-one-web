"use client";

import { useAuth, SignInButton, SignOutButton } from "@clerk/astro/react";

export function AuthButton({ variant = "navbar" }: { variant?: "navbar" | "app" }) {
  const { isLoaded, isSignedIn, userId } = useAuth();

  if (!isLoaded) {
    return (
      <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  if (isSignedIn && userId) {
    if (variant === "app") {
      return (
        <div className="flex items-center gap-3">
          <UserAvatar client:visible />
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white/70">
              Conectado
            </p>
          </div>
          <SignOutButton>
            <button
              type="button"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      );
    }

    // Navbar variant
    return (
      <div className="flex items-center gap-2">
        <UserAvatar />
        <span className="text-xs text-white/50 hidden sm:inline">
          Conectado
        </span>
        <SignOutButton>
          <button
            type="button"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            Salir
          </button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <SignInButton mode="redirect" fallbackRedirectUrl="/link-tiktok">
      <button
        type="button"
        className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, #fe2c55, #e8254a)",
          color: "white",
        }}
      >
        Ingresar
      </button>
    </SignInButton>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-white/10 flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}
