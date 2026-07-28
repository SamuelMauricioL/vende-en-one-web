import { clerkMiddleware } from "@clerk/astro/server";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app", "/link-tiktok"];

// Paths that require a linked TikTok account (subset of protectedPaths)
const tiktokRequiredPaths = ["/app"];

// All /api/* requests → proxy to Railway, skip Clerk
// All other routes → Clerk middleware for auth

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Proxy /api/* requests directly to Railway with auth context
  if (pathname.startsWith("/api/")) {
    const { userId } = auth();
    return proxyApi(context.request, pathname.replace("/api/", ""), userId);
  }

  // Clerk auth for protected paths
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
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

async function proxyApi(request: Request, apiPath: string, clerkUserId?: string | null) {
  const target = API_BASE + "/" + apiPath;
  const method = request.method;
  const isStream = apiPath.includes("/stream");

  const headers: Record<string, string> = {};
  const ct = request.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const accept = request.headers.get("accept");
  if (accept) headers["accept"] = accept;
  if (!isStream && !ct) headers["content-type"] = "application/json";

  // Forward Clerk user ID to API for user identification
  if (clerkUserId) {
    headers["x-clerk-user-id"] = clerkUserId;
  }

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method) && !isStream) {
    body = await request.text().catch(() => undefined);
  }

  try {
    const res = await fetch(target, {
      method,
      headers,
      body,
      signal: isStream ? undefined : AbortSignal.timeout(25000),
    });

    if (isStream) {
      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return new Response(
      JSON.stringify({
        error: "proxy_error",
        message: error.message,
        code: (error as NodeJS.ErrnoException).code,
        type: error.constructor.name,
        target,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
