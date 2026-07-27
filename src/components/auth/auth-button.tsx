"use client";

import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

export function AuthButton({ variant = "navbar" }: { variant?: "navbar" | "app" }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  if (isSignedIn && user) {
    if (variant === "app") {
      return (
        <div className="flex items-center gap-3">
          {user.imageUrl && (
            <img
              src={user.imageUrl}
              alt=""
              className="w-7 h-7 rounded-full ring-2 ring-white/10"
            />
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white/70">
              {user.fullName || user.primaryEmailAddress?.emailAddress || "Usuario"}
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
        {user.imageUrl && (
          <img
            src={user.imageUrl}
            alt=""
            className="w-6 h-6 rounded-full ring-1 ring-white/10"
          />
        )}
        <span className="text-xs text-white/50 hidden sm:inline">
          {user.fullName?.split(" ")[0] || "Usuario"}
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
    <SignInButton mode="redirect">
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
