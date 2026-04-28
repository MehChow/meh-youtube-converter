import { getPublicConfig } from './env';
import { z } from 'zod';
import { toFriendlyApiErrorMessage, toFriendlyNetworkErrorMessage } from './errors';

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
    res = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error(toFriendlyNetworkErrorMessage('convert'));
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
    res = await fetch(`${API_BASE_URL}/preview`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error(toFriendlyNetworkErrorMessage('preview'));
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
