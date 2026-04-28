import { z } from 'zod';

const ALLOWED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

function tryToUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

export function normalizeYouTubeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Accept common paste formats:
  // - youtu.be/<id>  (no protocol)
  // - youtube.com/watch?v=... (no protocol)
  // - http://... (coerce to https)
  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  if (withProtocol.startsWith('http://')) return `https://${withProtocol.slice('http://'.length)}`;
  return withProtocol;
}

export const YouTubeUrlSchema = z
  .string()
  .min(10, '請貼上 YouTube 影片連結。')
  .max(2048, '連結太長了。')
  .transform((s) => normalizeYouTubeUrl(s))
  .superRefine((v, ctx) => {
    const u = tryToUrl(v);
    if (!u) {
      ctx.addIssue({ code: 'custom', message: '連結格式不正確。' });
      return;
    }

    if (u.protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', message: '只支援 https 的 YouTube 連結。' });
      return;
    }

    if (!ALLOWED_HOSTS.has(u.hostname)) {
      ctx.addIssue({ code: 'custom', message: '這看起來不是 YouTube 連結。' });
      return;
    }

    if (u.searchParams.has('list')) {
      ctx.addIssue({ code: 'custom', message: '目前不支援播放清單（playlist）。' });
      return;
    }
  });

export function parseYouTubeUrl(
  raw: string
): { ok: true; url: string } | { ok: false; message: string } {
  const res = YouTubeUrlSchema.safeParse(raw);
  if (!res.success) {
    const message = res.error.issues[0]?.message || '連結格式不正確。';
    return { ok: false, message };
  }
  return { ok: true, url: res.data };
}
