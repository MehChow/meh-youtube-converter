# YouTube Converter (Expo app)

This folder contains the Expo (SDK 55) app for the YouTube → MP3 project. For full end-to-end setup (including the Fastify backend + Docker), see the repo root `README.md`.

## Prereqs

- Node.js + npm
- Android Studio (emulator) or a physical Android phone
- A **native build / dev-client** is required (this app uses `react-native-blob-util`), so **Expo Go won’t work** for real downloads.

## Setup

1) Install deps:

```bash
npm install
```

2) Configure env:

```bash
cp .env.example .env
```

Set:

- `EXPO_PUBLIC_API_BASE_URL=http://<PC_LAN_IP>:3000`
- `EXPO_PUBLIC_API_KEY=<API_KEY>`

## Run (dev server)

```bash
npm run dev
```

This runs `expo start -c`.

## Native build notes

- If you change NativeWind/Tailwind class usage under `src/**`, ensure `tailwind.config.js` includes `./src/**/*.{ts,tsx}` in `content`.
