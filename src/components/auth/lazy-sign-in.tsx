"use client";

import { useEffect, useState } from "react";

export function LazySignIn() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@clerk/astro/react").then((mod) => {
      setComponent(() => mod.SignIn);
    });
  }, []);

  if (!Component) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
      </div>
    );
  }

  return <Component afterSignInUrl="/app" />;
}

export function LazySignUp() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@clerk/astro/react").then((mod) => {
      setComponent(() => mod.SignUp);
    });
  }, []);

  if (!Component) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
      </div>
    );
  }

  return <Component />;
}
