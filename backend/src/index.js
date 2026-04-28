const Fastify = require("fastify");
const sensible = require("@fastify/sensible");
const rateLimit = require("@fastify/rate-limit");

const { convertRoute } = require("./routes/convert");
const { previewRoute } = require("./routes/preview");
const { startTmpSweeper } = require("./tmpSweeper");

const API_KEY = process.env.API_KEY || "";
const PORT = Number(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty" },
    },
    bodyLimit: 2 * 1024, // URL-only JSON payload
    trustProxy: true,
  });

  app.register(sensible);
  app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX || "15"),
    timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
  });

  app.addHook("onRequest", async (req) => {
    if (!API_KEY) {
      req.log.warn("API_KEY not set; refusing requests");
      throw app.httpErrors.serviceUnavailable("Server not configured");
    }
  });

  app.addHook("preHandler", async (req) => {
    const rawUrl = req.raw.url || "/";
    const parsed = new URL(rawUrl, "http://local");
    const isDownloadWithToken =
      req.method === "GET" &&
      parsed.pathname.startsWith("/download/") &&
      parsed.searchParams.has("token");
    if (isDownloadWithToken) return;

    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || key.length < 12 || key !== API_KEY) {
      throw app.httpErrors.unauthorized("Invalid API key");
    }
  });

  app.get("/health", async () => ({ ok: true }));
  app.register(previewRoute, { prefix: "" });
  app.register(convertRoute, { prefix: "" });

  startTmpSweeper({ logger: app.log });

  return app;
}

async function main() {
  const app = buildApp();
  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

module.exports = { buildApp };
