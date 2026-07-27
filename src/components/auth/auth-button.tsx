"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton({ variant = "navbar" }: { variant?: "navbar" | "app" }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return (
      <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  if (session?.user) {
    if (variant === "app") {
      return (
        <div className="flex items-center gap-3">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-7 h-7 rounded-full ring-2 ring-white/10"
            />
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white/70">
              {session.user.name || session.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      );
    }

    // Navbar variant
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            className="w-6 h-6 rounded-full ring-1 ring-white/10"
          />
        )}
        <span className="text-xs text-white/50 hidden sm:inline">
          {session.user.name?.split(" ")[0] || "Usuario"}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: "linear-gradient(135deg, #fe2c55, #e8254a)",
        color: "white",
      }}
    >
      Ingresar
    </button>
  );
}
