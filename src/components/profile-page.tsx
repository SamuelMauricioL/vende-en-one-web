"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import StoresManager from "@/components/stores-manager";

export default function ProfilePage() {
  const { userId, isLoaded: authLoaded, getToken } = useAuth();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Get Clerk user info from global client
  useEffect(() => {
    if (!authLoaded || !userId) return;
    const clerkUser = (window as any).Clerk?.user;
    if (clerkUser) {
      setUserName(clerkUser.fullName || clerkUser.firstName || "");
      setUserEmail(clerkUser.primaryEmailAddress?.emailAddress || "");
    }
  }, [authLoaded, userId]);



  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="profile" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 pt-8 pb-12">
        {/* Avatar icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(254,44,85,0.1)" }}
        >
          <svg className="w-7 h-7" style={{ color: "#fe2c55" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <h1
          className="text-center text-lg font-bold mb-8"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          Perfil
        </h1>

        {(
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Name — read-only */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Nombre
              </label>
              <div
                className="h-11 flex items-center px-4 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {userName || "—"}
              </div>
            </div>

            {/* Email — read-only */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Correo electrónico
              </label>
              <div
                className="h-11 flex items-center px-4 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {userEmail || "—"}
              </div>
            </div>

          </div>
        )}

        {/* Mis tiendas: desde acá se agrega, se elige la activa y se elimina */}
        <section id="tiendas" className="mt-8">
          <h2 className="text-sm font-bold text-white/80 mb-1">Mis tiendas</h2>
          <p className="text-[11px] text-white/30 mb-3">
            La tienda activa se elige en el menú y aplica a Live, Bandeja y Filtros.
          </p>
          <StoresManager />
        </section>
      </main>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
