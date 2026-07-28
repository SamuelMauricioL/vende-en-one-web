const API = "https://vende-en-one-api-production.up.railway.app";

export const GET = async () => {
  try {
    const res = await fetch(API + "/lives", { signal: AbortSignal.timeout(15000) });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
