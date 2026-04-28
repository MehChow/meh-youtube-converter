# YouTube → MP3 Converter

Personal-use Android app (Expo SDK 55) + self-hosted backend (Fastify) that converts a YouTube URL to MP3 via `yt-dlp` and downloads it to the phone’s **Downloads** folder.

## LAN-only setup (no domain required)

This repo is now configured for **local network only**:

- **No domain, no Caddy, no port-forwarding**
- Your phone must be on the same **home Wi‑Fi** (or on a VPN into your home network)
- The app talks to your PC using its **LAN IPv4**, like `http://192.168.1.50:3000`

## Repo layout

- `backend/`: Fastify API + conversion logic
- `youtube-converter/`: Expo Android app (SDK 55 + NativeWind + TailwindCSS)
- `docker-compose.yml`: backend container (includes `yt-dlp` + `ffmpeg`)

## Backend API

- `POST /convert` (header `x-api-key`)
  - Body: `{ "url": "https://youtu.be/..." }`
  - Response: `{ jobId, filename, downloadUrl, expiresAt }`
- `GET /download/:jobId?token=...` (one-time token from `/convert`)
  - Streams `audio/mpeg` and cleans up temp files after download.

## Setup (server / PC)

### 1) Prereqs

- Docker Desktop (Linux containers)
- Your PC and phone on the same Wi‑Fi

### 2) Configure env

Copy the example env file:

- Create `.env` in the repo root (next to `docker-compose.yml`) with:
  - `API_KEY=your-long-random-secret`

### 3) Start the stack

From repo root:

```bash
docker compose up -d --build
```

Health check:

- `GET http://<PC_LAN_IP>:3000/health` with header `x-api-key: <API_KEY>`

### 4) Restrict access to home network (recommended)

- **Do NOT port-forward** router ports to this PC.
- Add a **Windows Defender Firewall** inbound rule that allows TCP `3000` only from your LAN subnet (example: `192.168.1.0/24`).

## Setup (Android app)

### 1) Prereqs

- Node.js + npm
- Expo/EAS tooling (dev-client is required because we use `react-native-blob-util`)

### 2) Configure app env

Copy the example env file:

```bash
cp youtube-converter/.env.example youtube-converter/.env
```

Then set:

- `EXPO_PUBLIC_API_BASE_URL=http://<PC_LAN_IP>:3000`
- `EXPO_PUBLIC_API_KEY=<API_KEY>`

### 3) Build & install (APK)

Because the app uses a native module for Android DownloadManager, you must build a dev-client/release build (Expo Go won’t work).

Typical flow:

```bash
cd youtube-converter
npx expo prebuild
```

Then build with EAS (recommended) or your local Android toolchain.

## Notes / troubleshooting

- **Docker engine not running**: `docker compose` will fail until Docker Desktop is started.
- **If you see 401s**: make sure the app/server `API_KEY` matches and you’re sending the `x-api-key` header.
- **If downloads don’t show in Downloads**: ensure you’re using a dev-client/native build (not Expo Go).

## Windows notes

- `youtube-converter/package.json` has a `clean` script using `rm -rf`, which won’t work in plain PowerShell/cmd. Use Git Bash/WSL, or change it to a cross-platform tool (e.g. `rimraf`) if you rely on it.
