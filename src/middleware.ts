import { clerkMiddleware } from "@clerk/astro/server";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app", "/onboarding"];

// Paths that require a linked TikTok account (subset of protectedPaths)
const tiktokRequiredPaths = ["/app"];

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

    // Check TikTok profile requirement for app paths
    const needsTikTok = tiktokRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (needsTikTok && userId) {
      try {
        // El API ahora exige token. Si no se puede obtener, seguimos sin él:
        // el API es la frontera de seguridad y la página mostrará lo que haya.
        let token: string | null = null;
        try {
          token = typeof getToken === "function" ? await getToken() : null;
        } catch {
          token = null;
        }

        const profileRes = await fetch(`${API_BASE}/users/profile/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(5000),
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          const tiktokUsername = data?.profile?.tiktokUsername;
          if (!tiktokUsername) {
            return context.redirect("/onboarding");
          }
        } else if (profileRes.status === 404) {
          // Perfil no existe todavía → falta vincular TikTok
          return context.redirect("/onboarding");
        }
        // 401/403/5xx: no se puede saber si tiene TikTok. No se expulsa al
        // onboarding por un fallo de autenticación; las páginas resuelven.
      } catch {
        // On error (timeout/network), allow access to avoid lockout
        // The client-side will handle the missing profile
      }
    }
  }

  return next();
});
