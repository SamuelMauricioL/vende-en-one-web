import { clerkMiddleware } from "@clerk/astro/server";

const API_BASE = "https://vende-en-one-api-production.up.railway.app";

const protectedPaths = ["/app"];

// All /api/* routes → proxy to Railway, skip Clerk
// All other routes → Clerk middleware for auth

export const onRequest = clerkMiddleware((auth, context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Proxy /api/* requests directly to Railway
  if (pathname.startsWith("/api/")) {
    return proxyApi(context.request, pathname.replace("/api/", ""));
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
  }

  return next();
});

async function proxyApi(request: Request, apiPath: string) {
  const target = API_BASE + "/" + apiPath;
  const method = request.method;
  const isStream = apiPath.includes("/stream");

  const headers: Record<string, string> = {};
  const ct = request.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const accept = request.headers.get("accept");
  if (accept) headers["accept"] = accept;
  if (!isStream && !ct) headers["content-type"] = "application/json";

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
    return new Response(
      JSON.stringify({
        error: "proxy_error",
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
