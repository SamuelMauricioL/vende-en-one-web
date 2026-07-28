"use client";

import { useAuth } from "@clerk/astro/react";

export default function ClerkOnly() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#0b0f1a" }}
    >
      <h1 className="text-3xl font-extrabold text-white">
        Clerk Only — isLoaded: {isLoaded ? "✅" : "⏳"} | userId: {userId || "null"}
      </h1>
    </div>
  );
}
