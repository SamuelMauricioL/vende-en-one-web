const API_BASE_URL =
  import.meta.env.API_BASE_URL ||
  "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ request, params }: { request: Request; params: { path?: string[] } }) => {
  return proxyRequest(request, params);
};

export const POST = async ({ request, params }: { request: Request; params: { path?: string[] } }) => {
  return proxyRequest(request, params);
};

export const PUT = async ({ request, params }: { request: Request; params: { path?: string[] } }) => {
  return proxyRequest(request, params);
};

export const DELETE = async ({ request, params }: { request: Request; params: { path?: string[] } }) => {
  return proxyRequest(request, params);
};

export const PATCH = async ({ request, params }: { request: Request; params: { path?: string[] } }) => {
  return proxyRequest(request, params);
};

async function proxyRequest(request: Request, params: { path?: string[] }) {
  const apiPath = "/" + (params.path?.join("/") || "");
  const url = new URL(apiPath, API_BASE_URL).toString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const accept = request.headers.get("Accept");
  if (accept) headers.Accept = accept;

  const isStream = params.path?.some((p) => p === "stream");
  const bodyStr =
    ["GET", "HEAD"].includes(request.method) || isStream
      ? undefined
      : await request.text().catch(() => "");

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: bodyStr || undefined,
      ...(isStream ? {} : { signal: AbortSignal.timeout(20000) }),
    });

    if (isStream) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream API unreachable";
    return new Response(
      JSON.stringify({ error: "proxy_error", message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
