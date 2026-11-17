import { clerkMiddleware } from "@clerk/astro/server";
import { ACTING_COOKIE, ACTING_COOKIE_VALUE } from "./lib/acting.ts";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app", "/onboarding"];

const storeRequiredPaths = ["/app"];

async function callerIsAdmin(
  userId: string,
  token: string | null
): Promise<boolean | null> {
  try {
    const res = await fetch(
      `${API_BASE}/users/profile/${encodeURIComponent(userId)}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      profile?: { role?: unknown } | null;
    };
    return data.profile?.role === "admin";
  } catch {
    return null;
  }
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

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

    const needsStore = storeRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    const actingRequested =
      context.cookies.get(ACTING_COOKIE)?.value === ACTING_COOKIE_VALUE;
    if (needsStore && userId && !actingRequested) {
      try {

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

        if (storesRes.ok) {
          const data = (await storesRes.json()) as { stores?: unknown[] };
          if (!data.stores || data.stores.length === 0) {
            const admin = await callerIsAdmin(userId, token);
            if (admin === false) {
              return context.redirect("/onboarding");
            }
          }
        }

      } catch {

      }
    }
  }

  return next();
});
