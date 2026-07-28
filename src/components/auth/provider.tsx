"use client";

import { ClerkProvider } from "@clerk/astro/react";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#fe2c55",
          colorBackground: "#0b0f1a",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
