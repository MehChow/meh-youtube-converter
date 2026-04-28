type ApiErrorJson = {
  statusCode?: number;
  error?: string;
  message?: unknown;
};

function parseMaybeJson(text: string): ApiErrorJson | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiErrorJson;
  } catch {
    return null;
  }
}

export function toFriendlyApiErrorMessage(opts: {
  action: 'preview' | 'convert';
  status: number;
  responseText: string;
}): string {
  const { action, status, responseText } = opts;
  const parsed = parseMaybeJson(responseText);

  // Backend uses Fastify httpErrors, which often returns { statusCode, error, message }.
  const serverMessage =
    typeof parsed?.message === 'string'
      ? parsed.message
      : Array.isArray(parsed?.message)
        ? parsed.message.join('\n')
        : '';

  // Prefer simple, user-facing messages.
  if (status === 401) return '連線失敗：API 金鑰不正確。';
  if (status === 429) return '你操作太快了，請稍後再試。';

  if (status === 400) {
    // Usually invalid URL / playlist not supported.
    return '連結不正確或不支援（例如播放清單）。請檢查後再試。';
  }

  if (status === 404) {
    return action === 'preview'
      ? '找不到這部影片，請確認連結是否正確。'
      : '找不到可下載的檔案，請重新轉換後再試。';
  }

  if (status >= 500) {
    // Common case: nonexistent video / yt-dlp failure → backend returns 500.
    return action === 'preview'
      ? '預覽失敗：找不到影片或暫時無法讀取。請確認連結後再試。'
      : '轉換失敗：伺服器暫時無法處理。請稍後再試。';
  }

  // Fallback. If the server provides a clean message, use it; otherwise generic.
  if (serverMessage && serverMessage.length <= 80) return serverMessage;
  return action === 'preview' ? '預覽失敗，請稍後再試。' : '轉換失敗，請稍後再試。';
}

export function toFriendlyNetworkErrorMessage(action: 'preview' | 'convert'): string {
  // fetch() throws TypeError on network issues.
  return action === 'preview'
    ? '無法連線到伺服器。請確認手機與電腦在同一個 Wi‑Fi，並檢查 API 位址。'
    : '無法連線到伺服器。請確認手機與電腦在同一個 Wi‑Fi，並檢查 API 位址。';
}

export function toFriendlyNetworkErrorMessageWithContext(opts: {
  action: 'preview' | 'convert';
  apiBaseUrl: string;
  isTimeout?: boolean;
  isOffline?: boolean;
}): string {
  const base = opts.apiBaseUrl ? `（目前：${opts.apiBaseUrl}）` : '';
  if (opts.isOffline) {
    return `你目前處於離線狀態（沒有網路連線）。請開啟 Wi‑Fi/行動數據後再試。${base}`;
  }
  if (opts.isTimeout) {
    return `連線逾時，請確認伺服器是否有開啟並再試一次。${base}`;
  }
  return `無法連線到伺服器。請確認手機與電腦在同一個 Wi‑Fi，並檢查 API 位址。${base}`;
}
