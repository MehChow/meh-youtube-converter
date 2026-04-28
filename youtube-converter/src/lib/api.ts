import { getPublicConfig } from './env';

type ConvertResponse = {
  downloadUrl?: string;
  filename?: string;
};

type PreviewResponse = {
  title?: string;
  uploader?: string;
  durationSeconds?: number | null;
  webpageUrl?: string;
  thumbnailUrl?: string;
};

export async function convertYouTubeUrl(url: string) {
  const { API_BASE_URL, API_KEY, isConfigured } = getPublicConfig();
  if (!isConfigured) {
    throw new Error('缺少 API 設定：EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_API_KEY。');
  }

  const res = await fetch(`${API_BASE_URL}/convert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`轉換失敗（${res.status}）：${text || res.statusText}`);
  }

  const data = (await res.json()) as ConvertResponse;
  const downloadUrl = data?.downloadUrl;
  const filename = String(data?.filename || 'audio.mp3');
  if (!downloadUrl) throw new Error('缺少 downloadUrl');

  const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE_URL}${downloadUrl}`;

  return { fullUrl, filename, apiKey: API_KEY };
}

export async function previewYouTubeUrl(url: string) {
  const { API_BASE_URL, API_KEY, isConfigured } = getPublicConfig();
  if (!isConfigured) {
    throw new Error('缺少 API 設定：EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_API_KEY。');
  }

  const res = await fetch(`${API_BASE_URL}/preview`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`預覽失敗（${res.status}）：${text || res.statusText}`);
  }

  const data = (await res.json()) as PreviewResponse;
  return {
    title: String(data?.title || ''),
    uploader: String(data?.uploader || ''),
    durationSeconds: typeof data?.durationSeconds === 'number' ? data.durationSeconds : null,
    webpageUrl: String(data?.webpageUrl || ''),
    thumbnailUrl: String(data?.thumbnailUrl || ''),
  };
}

