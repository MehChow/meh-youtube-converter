const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { z } = require("zod");

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const ConvertBodySchema = z.object({
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

function sanitizeFilename(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function createSemaphore(max) {
  let active = 0;
  const waiters = [];

  async function acquire() {
    if (active < max) {
      active += 1;
      return;
    }
    await new Promise((resolve) => waiters.push(resolve));
    active += 1;
  }

  function release() {
    active = Math.max(0, active - 1);
    const next = waiters.shift();
    if (next) next();
  }

  return { acquire, release, getActive: () => active };
}

const semaphore = createSemaphore(Number(process.env.MAX_CONCURRENCY || "2"));

const JOB_TTL_MS = Number(process.env.JOB_TTL_MS || "900000"); // 15 min
const jobs = new Map();

async function runYtDlp({ url, workDir, timeoutMs, logger }) {
  const outputTemplate = path.join(workDir, "%(title).200B.%(ext)s");
  const args = [
    "--no-playlist",
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--no-warnings",
    "--output",
    outputTemplate,
    url,
  ];

  const child = spawn("yt-dlp", args, {
    cwd: workDir,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const killTimer = setTimeout(() => {
    logger.warn({ timeoutMs }, "yt-dlp timeout; killing");
    child.kill("SIGKILL");
  }, timeoutMs);

  child.stdout.on("data", (b) => logger.debug({ out: b.toString() }, "yt-dlp"));
  child.stderr.on("data", (b) => logger.debug({ err: b.toString() }, "yt-dlp"));

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  clearTimeout(killTimer);

  if (exitCode !== 0) {
    throw new Error(`yt-dlp failed with exit code ${exitCode}`);
  }

  const files = await fs.readdir(workDir);
  const mp3 = files.find((f) => f.toLowerCase().endsWith(".mp3"));
  if (!mp3) throw new Error("Conversion completed but MP3 not found");

  return path.join(workDir, mp3);
}

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

function convertRoute(app, _opts, done) {
  function buildContentDisposition(filename) {
    // Prefer RFC 5987 filename* (UTF-8) while keeping an ASCII fallback.
    // Some clients ignore filename*; some mis-handle raw UTF-8 in filename.
    const safeAsciiFallback = sanitizeFilename(filename).replace(/[^\x20-\x7E]/g, "_");
    const encoded = encodeURIComponent(filename);
    return `attachment; filename="${safeAsciiFallback}"; filename*=UTF-8''${encoded}`;
  }

  app.get("/download/:jobId", async (req, reply) => {
    const jobId = String(req.params.jobId || "");
    const job = jobs.get(jobId);
    if (!job) throw app.httpErrors.notFound("Unknown job");
    const headerKey = req.headers["x-api-key"];
    const tokenFromQuery =
      typeof req.query?.token === "string" ? req.query.token : "";
    const hasValidApiKey =
      typeof headerKey === "string" &&
      headerKey.length >= 12 &&
      headerKey === process.env.API_KEY;
    const hasValidToken =
      tokenFromQuery.length >= 12 && tokenFromQuery === job.downloadToken;
    if (!hasValidApiKey && !hasValidToken) {
      throw app.httpErrors.unauthorized("Invalid download token");
    }

    if (Date.now() > job.expiresAt) {
      jobs.delete(jobId);
      await rmrf(job.workDir);
      throw app.httpErrors.notFound("Expired job");
    }

    const fileBuffer = await fs.readFile(job.mp3Path).catch(() => null);
    if (!fileBuffer) throw app.httpErrors.notFound("File missing");
    if (!fileBuffer.length) {
      throw app.httpErrors.internalServerError("Generated file is empty");
    }

    reply.header("Content-Type", "audio/mpeg");
    reply.header("Content-Length", String(fileBuffer.length));
    reply.header(
      "Content-Disposition",
      buildContentDisposition(job.filename)
    );
    reply.header("X-Job-Id", jobId);
    reply.header("Cache-Control", "no-store");

    let cleanedUp = false;
    const cleanup = async (reason) => {
      if (cleanedUp) return;
      cleanedUp = true;
      jobs.delete(jobId);
      await rmrf(job.workDir);
      req.log.info({ jobId, reason }, "download cleaned up");
    };

    // With a buffered response, finish means bytes are handed off.
    reply.raw.on("finish", () => {
      void cleanup("response_finish");
    });
    reply.raw.on("close", () => {
      if (!cleanedUp) {
        req.log.warn({ jobId }, "stream closed prematurely");
      }
    });

    reply.send(fileBuffer);
  });

  app.post("/convert", async (req, reply) => {
    const parsed = ConvertBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw app.httpErrors.badRequest(parsed.error.flatten().fieldErrors);
    }

    const timeoutMs = Number(process.env.CONVERT_TIMEOUT_MS || "300000");
    const jobId = randomUUID();
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `ytmp3-${jobId}-`));

    await semaphore.acquire();
    const startedAt = Date.now();

    try {
      const mp3Path = await runYtDlp({
        url: parsed.data.url,
        workDir,
        timeoutMs,
        logger: req.log,
      });

      const filename = sanitizeFilename(path.basename(mp3Path));
      const expiresAt = Date.now() + JOB_TTL_MS;
      const downloadToken = randomUUID();
      jobs.set(jobId, { mp3Path, workDir, filename, expiresAt, downloadToken });

      const downloadUrl = `/download/${jobId}?token=${encodeURIComponent(
        downloadToken
      )}`;
      reply.send({ jobId, filename, downloadUrl, expiresAt });
      req.log.info(
        { jobId, ms: Date.now() - startedAt, active: semaphore.getActive() },
        "conversion complete"
      );
    } catch (err) {
      await rmrf(workDir);
      req.log.warn({ err, jobId }, "job failed");
      throw app.httpErrors.internalServerError("Conversion failed");
    } finally {
      semaphore.release();
    }
  });

  done();
}

module.exports = { convertRoute };
