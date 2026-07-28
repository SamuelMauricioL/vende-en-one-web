const API_BASE_URL = "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ params }: { params: { path?: string[] } }) => {
  return proxy("GET", params);
};

export const POST = async ({ params, request }: { params: { path?: string[] }; request: Request }) => {
  return proxy("POST", params, request);
};

export const PUT = async ({ params, request }: { params: { path?: string[] }; request: Request }) => {
  return proxy("PUT", params, request);
};

export const DELETE = async ({ params, request }: { params: { path?: string[] }; request: Request }) => {
  return proxy("DELETE", params, request);
};

export const PATCH = async ({ params, request }: { params: { path?: string[] }; request: Request }) => {
  return proxy("PATCH", params, request);
};

async function proxy(method: string, params: { path?: string[] }, request?: Request) {
  const apiPath = "/" + (params.path?.join("/") || "");
  const url = new URL(apiPath, API_BASE_URL).toString();
  const isStream = params.path?.some((p) => p === "stream");

  const headers: Record<string, string> = {};
  const accept = request?.headers.get("Accept");
  if (accept) headers["Accept"] = accept;
  if (!isStream) headers["Content-Type"] = "application/json";

  let body: string | undefined;
  if (request && !["GET", "HEAD"].includes(method) && !isStream) {
    body = await request.text().catch(() => "");
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
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
        message: err instanceof Error ? err.message : "Upstream unreachable",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
