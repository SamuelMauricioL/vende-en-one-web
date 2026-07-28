const API = "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ params }: { params: Record<string, any> }) => {
  const target = API + "/" + (params.path?.join("/") ?? "");
  const res = await fetch(target, { signal: AbortSignal.timeout(15000) });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
