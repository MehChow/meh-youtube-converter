import { getPublicConfig } from './env';
import { z } from 'zod';
import { toFriendlyApiErrorMessage, toFriendlyNetworkErrorMessageWithContext } from './errors';
import NetInfo from '@react-native-community/netinfo';

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  if (!timeoutMs) return fetch(input, rest);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function ensureOnlineOrThrow(apiBaseUrl: string, action: 'preview' | 'convert') {
  const state = await NetInfo.fetch().catch(() => null);
  // `isInternetReachable` can be null on first load; fall back to `isConnected`.
  const isOffline =
    state?.isConnected === false || state?.isInternetReachable === false;
  if (isOffline) {
    throw new Error(
      toFriendlyNetworkErrorMessageWithContext({
        action,
        apiBaseUrl,
        isOffline: true,
      })
    );
  }
}

const ConvertResponseSchema = z.object({
  downloadUrl: z.string().min(1),
  filename: z.string().optional(),
});

const PreviewResponseSchema = z.object({
  title: z.string().optional(),
  uploader: z.string().optional(),
  durationSeconds: z.number().nullable().optional(),
  webpageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export async function convertYouTubeUrl(url: string) {
  const { API_BASE_URL, API_KEY, isConfigured } = getPublicConfig();
  if (!isConfigured) {
    throw new Error('缺少 API 設定：EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_API_KEY。');
  }

  let res: Response;
  try {
    await ensureOnlineOrThrow(API_BASE_URL, 'convert');
    res = await fetchWithTimeout(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ url }),
      timeoutMs: 20_000,
    });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    if (e instanceof Error && e.message.includes('離線狀態')) throw e;
    throw new Error(
      toFriendlyNetworkErrorMessageWithContext({
        action: 'convert',
        apiBaseUrl: API_BASE_URL,
        isTimeout,
      })
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Keep details for debugging but show a friendly message to end-users.
    // eslint-disable-next-line no-console
    console.warn('convert failed', res.status, text);
    throw new Error(
      toFriendlyApiErrorMessage({ action: 'convert', status: res.status, responseText: text })
    );
  }

  const raw = await res.json().catch(() => null);
  const parsed = ConvertResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('轉換失敗：回傳格式不正確。');
  }

  const downloadUrl = parsed.data.downloadUrl;
  const filename = parsed.data.filename?.trim() ? parsed.data.filename : 'audio.mp3';

  const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE_URL}${downloadUrl}`;

  return { fullUrl, filename, apiKey: API_KEY };
}

export async function previewYouTubeUrl(url: string) {
  const { API_BASE_URL, API_KEY, isConfigured } = getPublicConfig();
  if (!isConfigured) {
    throw new Error('缺少 API 設定：EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_API_KEY。');
  }

  let res: Response;
  try {
    await ensureOnlineOrThrow(API_BASE_URL, 'preview');
    res = await fetchWithTimeout(`${API_BASE_URL}/preview`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ url }),
      timeoutMs: 12_000,
    });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    if (e instanceof Error && e.message.includes('離線狀態')) throw e;
    throw new Error(
      toFriendlyNetworkErrorMessageWithContext({
        action: 'preview',
        apiBaseUrl: API_BASE_URL,
        isTimeout,
      })
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // eslint-disable-next-line no-console
    console.warn('preview failed', res.status, text);
    throw new Error(
      toFriendlyApiErrorMessage({ action: 'preview', status: res.status, responseText: text })
    );
  }

  const raw = await res.json().catch(() => null);
  const parsed = PreviewResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('預覽失敗：回傳格式不正確。');
  }

  const data = parsed.data;
  return {
    title: String(data?.title || ''),
    uploader: String(data?.uploader || ''),
    durationSeconds: typeof data?.durationSeconds === 'number' ? data.durationSeconds : null,
    webpageUrl: String(data?.webpageUrl || ''),
    thumbnailUrl: String(data?.thumbnailUrl || ''),
  };
}
