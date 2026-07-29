import { clerkMiddleware } from "@clerk/astro/server";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app", "/link-tiktok"];

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
    const { userId } = auth();
    if (!userId) {
      return context.redirect("/sign-in");
    }

    // Check TikTok profile requirement for app paths
    const needsTikTok = tiktokRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (needsTikTok && userId) {
      try {
        const profileRes = await fetch(`${API_BASE}/users/profile/${userId}`, {
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          const tiktokUsername = data?.profile?.tiktokUsername;
          if (!tiktokUsername) {
            return context.redirect("/link-tiktok");
          }
        } else {
          // Profile not found (404) → no TikTok linked yet
          return context.redirect("/link-tiktok");
        }
      } catch {
        // On error (timeout/network), allow access to avoid lockout
        // The client-side will handle the missing profile
      }
    }
  }

  return next();
});
