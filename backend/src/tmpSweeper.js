const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

async function startTmpSweeper({ logger }) {
  const intervalMs = Number(process.env.SWEEP_INTERVAL_MS || "3600000"); // 1h
  const maxAgeMs = Number(process.env.SWEEP_MAX_AGE_MS || "3600000"); // 1h
  const prefix = "ytmp3-";

  setInterval(async () => {
    try {
      const tmp = os.tmpdir();
      const entries = await fs.readdir(tmp, { withFileTypes: true });
      const cutoff = Date.now() - maxAgeMs;

      for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (!e.name.startsWith(prefix)) continue;

        const full = path.join(tmp, e.name);
        const st = await fs.stat(full).catch(() => null);
        if (!st) continue;
        if (st.mtimeMs > cutoff) continue;

        await fs.rm(full, { recursive: true, force: true });
        logger.info({ full }, "swept temp dir");
      }
    } catch (err) {
      logger.warn({ err }, "tmp sweeper failed");
    }
  }, intervalMs).unref();
}

module.exports = { startTmpSweeper };

