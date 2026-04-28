import { toFriendlyApiErrorMessage, toFriendlyNetworkErrorMessageWithContext } from '../errors';

describe('toFriendlyApiErrorMessage', () => {
  test('preview 500 returns friendly message (not raw JSON)', () => {
    const msg = toFriendlyApiErrorMessage({
      action: 'preview',
      status: 500,
      responseText: JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'Preview failed' }),
    });
    expect(msg).toContain('預覽失敗');
    expect(msg).not.toContain('statusCode');
  });

  test('401 returns API key message', () => {
    const msg = toFriendlyApiErrorMessage({ action: 'preview', status: 401, responseText: '' });
    expect(msg).toContain('API');
    expect(msg).toContain('金鑰');
  });

  test('429 returns rate limit message', () => {
    const msg = toFriendlyApiErrorMessage({ action: 'preview', status: 429, responseText: '' });
    expect(msg).toContain('太快');
  });

  test('400 returns invalid link message', () => {
    const msg = toFriendlyApiErrorMessage({ action: 'preview', status: 400, responseText: '' });
    expect(msg).toContain('連結');
  });

  test('404 returns not-found message (preview)', () => {
    const msg = toFriendlyApiErrorMessage({
      action: 'preview',
      status: 404,
      responseText: JSON.stringify({ statusCode: 404, error: 'Not Found', message: 'Not found' }),
    });
    expect(msg).toContain('找不到');
  });

  test('non-JSON body still returns friendly message', () => {
    const msg = toFriendlyApiErrorMessage({
      action: 'preview',
      status: 500,
      responseText: '<html>upstream error</html>',
    });
    expect(msg).toContain('預覽失敗');
    expect(msg).not.toContain('<html>');
  });
});

describe('offline message', () => {
  test('offline message includes API base URL context', async () => {
    const msg = toFriendlyNetworkErrorMessageWithContext({
      action: 'preview',
      apiBaseUrl: 'http://192.168.1.50:3000',
      isOffline: true,
    });
    expect(msg).toContain('離線');
    expect(msg).toContain('192.168.1.50');
  });
});

