import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://vende-en-one-api-production.up.railway.app";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = "/" + (path?.join("/") || "");
  const url = new URL(apiPath, API_BASE_URL).toString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const accept = req.headers.get("Accept");
  if (accept) headers.Accept = accept;

  const isStream = path?.some((p) => p === "stream");

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : JSON.stringify(await req.json().catch(() => ({}))),
      ...(isStream ? {} : { signal: AbortSignal.timeout(15000) }),
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
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "proxy_error",
        message: err instanceof Error ? err.message : "Upstream API unreachable",
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
