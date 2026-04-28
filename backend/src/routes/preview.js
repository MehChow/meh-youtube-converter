const { spawn } = require("node:child_process");
const { z } = require("zod");

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const PreviewBodySchema = z.object({
  url: z
    .string()
    .min(10)
    .max(2048)
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" && ALLOWED_HOSTS.has(u.hostname);
      } catch {
        return false;
      }
    }, "Invalid YouTube URL")
    .refine((v) => {
      const u = new URL(v);
      return !u.searchParams.has("list");
    }, "Playlists are not supported"),
});

function pickThumbnailUrl(info) {
  if (typeof info?.thumbnail === "string" && info.thumbnail) return info.thumbnail;
  const thumbs = Array.isArray(info?.thumbnails) ? info.thumbnails : [];
  // yt-dlp tends to order thumbnails from low->high; last often best.
  for (let i = thumbs.length - 1; i >= 0; i -= 1) {
    const t = thumbs[i];
    if (t && typeof t.url === "string" && t.url) return t.url;
  }
  return "";
}

async function runYtDlpPreview({ url, timeoutMs, logger }) {
  const args = [
    "--no-playlist",
    "--skip-download",
    "--dump-json",
    "--no-warnings",
    url,
  ];

  const child = spawn("yt-dlp", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  const killTimer = setTimeout(() => {
    logger.warn({ timeoutMs }, "yt-dlp preview timeout; killing");
    child.kill("SIGKILL");
  }, timeoutMs);

  child.stdout.on("data", (b) => {
    stdout += b.toString();
  });
  child.stderr.on("data", (b) => {
    stderr += b.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  clearTimeout(killTimer);

  if (exitCode !== 0) {
    logger.warn({ exitCode, stderr: stderr.slice(-4000) }, "yt-dlp preview failed");
    throw new Error(`yt-dlp preview failed with exit code ${exitCode}`);
  }

  const raw = stdout.trim();
  if (!raw) throw new Error("yt-dlp preview returned empty output");

  let info;
  try {
    info = JSON.parse(raw);
  } catch (err) {
    logger.warn(
      { err, sample: raw.slice(0, 500) },
      "yt-dlp preview json parse failed"
    );
    throw new Error("yt-dlp preview returned invalid JSON");
  }

  const title = typeof info?.title === "string" ? info.title : "";
  const uploader =
    typeof info?.uploader === "string"
      ? info.uploader
      : typeof info?.channel === "string"
        ? info.channel
        : "";
  const durationSeconds =
    typeof info?.duration === "number" && Number.isFinite(info.duration) ? info.duration : null;
  const webpageUrl =
    typeof info?.webpage_url === "string"
      ? info.webpage_url
      : typeof info?.original_url === "string"
        ? info.original_url
        : url;
  const thumbnailUrl = pickThumbnailUrl(info);

  return { title, uploader, durationSeconds, webpageUrl, thumbnailUrl };
}

function previewRoute(app, _opts, done) {
  app.post("/preview", async (req, reply) => {
    const parsed = PreviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw app.httpErrors.badRequest(parsed.error.flatten().fieldErrors);
    }

    const timeoutMs = Number(process.env.PREVIEW_TIMEOUT_MS || "60000");

    try {
      const data = await runYtDlpPreview({
        url: parsed.data.url,
        timeoutMs,
        logger: req.log,
      });
      reply.send(data);
    } catch (err) {
      req.log.warn({ err }, "preview failed");
      throw app.httpErrors.internalServerError("Preview failed");
    }
  });

  done();
}

module.exports = { previewRoute };

