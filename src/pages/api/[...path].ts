const API = "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ request, params }: any) => {
  return forward(request, params?.path ?? []);
};

export const POST = async ({ request, params }: any) => {
  return forward(request, params?.path ?? []);
};

export const PUT = async ({ request, params }: any) => {
  return forward(request, params?.path ?? []);
};

export const DELETE = async ({ request, params }: any) => {
  return forward(request, params?.path ?? []);
};

export const PATCH = async ({ request, params }: any) => {
  return forward(request, params?.path ?? []);
};

async function forward(request: Request, path: string[]) {
  const target = API + "/" + path.join("/");
  const method = request.method;
  const headers: Record<string, string> = {};
  const ct = request.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const accept = request.headers.get("accept");
  if (accept) headers["accept"] = accept;

  const isStream = path.includes("stream");
  let body: any;
  if (!["GET", "HEAD"].includes(method) && !isStream) {
    body = await request.text().catch(() => null);
  }

  try {
    const up = await fetch(target, {
      method,
      headers,
      body,
      signal: isStream ? undefined : AbortSignal.timeout(20000),
    });

    if (isStream) {
      return new Response(up.body, {
        status: up.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new Response(await up.text(), {
      status: up.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "proxy_err", detail: e?.message ?? String(e) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
