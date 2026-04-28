# Backend (Fastify + yt-dlp)

Fastify API that previews YouTube metadata and converts a YouTube URL to MP3 using `yt-dlp` + `ffmpeg`.

For the recommended Docker setup, see the repo root `README.md` and `docker-compose.yml`.

## Endpoints

- `GET /health` (requires header `x-api-key`)
- `POST /preview` (requires header `x-api-key`)
- `POST /convert` (requires header `x-api-key`)
- `GET /download/:jobId?token=...` (token-based; API key also works)

## Required env vars

- `API_KEY` (required; server returns 503 until set)

## Optional env vars

- `PORT` (default `3000`)
- `HOST` (default `0.0.0.0`)
- `MAX_CONCURRENCY` (default `2`)
- `CONVERT_TIMEOUT_MS` (default `300000`)
- `PREVIEW_TIMEOUT_MS` (default `60000`)
- `RATE_LIMIT_MAX` (default `15`)
- `RATE_LIMIT_WINDOW` (default `1 minute`)
- `JOB_TTL_MS` (default `900000`)
- `SWEEP_INTERVAL_MS` (default `3600000`)
- `SWEEP_MAX_AGE_MS` (default `3600000`)

## Run without Docker (local)

You must have `yt-dlp` and `ffmpeg` available on your PATH.

```bash
npm install
API_KEY=your-long-random-secret npm run dev
```

