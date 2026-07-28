const API = "https://vende-en-one-api-production.up.railway.app";

export const GET = async ({ params }: { params: Record<string, any> }) => {
  const slug = (params.slug as string[])?.join("/") ?? "";
  const target = API + "/" + slug;
  const res = await fetch(target, { signal: AbortSignal.timeout(20000) });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
