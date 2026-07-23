import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE_URL =
  process.env.API_BASE_URL || "https://vende-en-one-api-production.up.railway.app";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Proxy passthrough to the upstream API.
app.use("/api", async (req, res) => {
  const path = req.originalUrl.replace(/^\/api\/?/, "/");
  const url = new URL(path, API_BASE_URL).toString();

  const headers = { "Content-Type": "application/json" };
  if (req.header("Accept")) headers.Accept = req.header("Accept");

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });

    const text = await upstream.text();
    res.status(upstream.status).type("application/json").send(text);
  } catch (err) {
    res.status(502).json({
      error: "proxy_error",
      message: err?.message || "Upstream API unreachable",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Vende en One Web → http://localhost:${PORT}`);
  console.log(`Proxing API → ${API_BASE_URL}`);
});