import { clerkMiddleware } from "@clerk/astro/server";
import { ACTING_COOKIE, ACTING_COOKIE_VALUE } from "./lib/acting.ts";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app", "/onboarding"];

// Paths that require at least one linked store (subset of protectedPaths)
const storeRequiredPaths = ["/app"];

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Clerk auth for protected paths
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Redirect signed-in users from landing to /app
  if (pathname === "/" || pathname === "/index.html") {
    const { userId } = auth();
    if (userId) {
      return context.redirect("/app");
    }
  }

  if (isProtected) {
    const { userId, getToken } = auth();
    if (!userId) {
      return context.redirect("/sign-in");
    }

    // Check store requirement for app paths
    const needsStore = storeRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    const actingRequested =
      context.cookies.get(ACTING_COOKIE)?.value === ACTING_COOKIE_VALUE;
    if (needsStore && userId && !actingRequested) {
      try {
        // El API ahora exige token. Si no se puede obtener, seguimos sin él:
        // el API es la frontera de seguridad y la página mostrará lo que haya.
        let token: string | null = null;
        try {
          token = typeof getToken === "function" ? await getToken() : null;
        } catch {
          token = null;
        }

        const storesRes = await fetch(`${API_BASE}/stores`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(5000),
        });

        // S5: se decide por tiendas, no por el `@` del perfil (que solo guarda
        // el último vinculado y desaparece de la base: ver
        // odd/tasks/perfil-sin-tiktok-username.md).
        if (storesRes.ok) {
          const data = (await storesRes.json()) as { stores?: unknown[] };
          if (!data.stores || data.stores.length === 0) {
            return context.redirect("/onboarding");
          }
        }
        // 401/403/5xx: no se puede saber si tiene tiendas. No se expulsa al
        // onboarding por un fallo de autenticación; las páginas resuelven.
      } catch {
        // On error (timeout/network), allow access to avoid lockout
        // The client-side will handle the missing profile
      }
    }
  }

  return next();
});
