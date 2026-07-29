"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";

export default function ProfilePage() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  const hasChanges = tiktokUsername !== originalUsername;

  // Fetch current TikTok username from profile
  useEffect(() => {
    if (!authLoaded || !userId) return;
    setFetching(true);
    fetch(`/api/users/profile/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const stored = data?.profile?.tiktokUsername || "";
        setTiktokUsername(stored);
        setOriginalUsername(stored);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [userId, authLoaded]);

  const handleSave = useCallback(async () => {
    if (!userId || !tiktokUsername.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: userId,
          tiktokUsername: tiktokUsername.trim(),
        }),
      });
      if (res.ok) {
        setOriginalUsername(tiktokUsername.trim());
        toast.success("Usuario de TikTok actualizado");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de red al guardar");
    } finally {
      setLoading(false);
    }
  }, [userId, tiktokUsername]);

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

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          </div>
        ) : (
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

            {/* TikTok username — editable */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Usuario de TikTok
              </label>
              <input
                type="text"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                placeholder="ej: gatyetperu1"
                className="w-full h-11 px-4 rounded-xl text-sm transition-all duration-200 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(254,44,85,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Este usuario se usará para buscar tu historial de lives
              </p>
            </div>

            {/* Save button */}
            <button
              type="button"
              disabled={!hasChanges || loading || !tiktokUsername.trim()}
              onClick={handleSave}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: hasChanges ? "#fe2c55" : "rgba(255,255,255,0.06)",
                color: hasChanges ? "#fff" : "rgba(255,255,255,0.25)",
                boxShadow: hasChanges ? "0 4px 20px rgba(254,44,85,0.25)" : "none",
                cursor: hasChanges && !loading ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (hasChanges && !loading) {
                  e.currentTarget.style.backgroundColor = "#e8254a";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(254,44,85,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                if (hasChanges && !loading) {
                  e.currentTarget.style.backgroundColor = "#fe2c55";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(254,44,85,0.25)";
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        )}
      </main>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
