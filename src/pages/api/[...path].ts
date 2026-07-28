const API_BASE_URL = "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ params }: { params: { path?: string[] } }) => {
  return proxy("GET", params);
};

export const POST = async ({ params, request }: { params: { path?: string[] }; request: Request }) => {
  return proxy("POST", params, request);
};

async function proxy(method: string, params: { path?: string[] }, request?: Request) {
  const apiPath = "/" + (params.path?.join("/") || "");
  const url = new URL(apiPath, API_BASE_URL).toString();
  const isStream = params.path?.some((p) => p === "stream");

  try {
    // Debug: first just try to reach Railway
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const headers: Record<string, string> = {};
    const accept = request?.headers.get("Accept");
    if (accept) headers["Accept"] = accept;
    if (!isStream) headers["Content-Type"] = "application/json";

    let body: string | undefined;
    if (request && !["GET", "HEAD"].includes(method) && !isStream) {
      const text = await request.text().catch(() => "");
      body = text || undefined;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

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
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : typeof err;
    return new Response(
      JSON.stringify({ error: "proxy_error", name, message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
