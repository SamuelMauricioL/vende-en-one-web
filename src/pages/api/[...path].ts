const API_BASE_URL = "https://vende-en-one-api-production.up.railway.app";

export const GET = async (ctx: any) => {
  return proxy("GET", ctx);
};

export const POST = async (ctx: any) => {
  return proxy("POST", ctx);
};

export const PUT = async (ctx: any) => {
  return proxy("PUT", ctx);
};

export const DELETE = async (ctx: any) => {
  return proxy("DELETE", ctx);
};

export const PATCH = async (ctx: any) => {
  return proxy("PATCH", ctx);
};

async function proxy(method: string, ctx: any) {
  const apiPath = "/" + ((ctx.params?.path as string[])?.join("/") || "");
  const url = new URL(apiPath, API_BASE_URL).toString();
  const isStream = apiPath.includes("/stream");

  try {
    const headers: Record<string, string> = {};
    const accept = ctx.request?.headers.get("Accept");
    if (accept) headers["Accept"] = accept;
    if (!isStream) headers["Content-Type"] = "application/json";

    let body: string | undefined;
    if (ctx.request && !["GET", "HEAD"].includes(method) && !isStream) {
      body = (await ctx.request.text().catch(() => "")) || undefined;
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(t);

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
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
