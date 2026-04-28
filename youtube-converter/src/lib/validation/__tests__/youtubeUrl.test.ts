import { normalizeYouTubeUrl, parseYouTubeUrl } from '../youtubeUrl';

describe('youtubeUrl', () => {
  test('normalizeYouTubeUrl: adds https:// when missing', () => {
    expect(normalizeYouTubeUrl('youtu.be/abc')).toBe('https://youtu.be/abc');
  });

  test('normalizeYouTubeUrl: coerces http:// to https://', () => {
    expect(normalizeYouTubeUrl('http://youtube.com/watch?v=xyz')).toBe(
      'https://youtube.com/watch?v=xyz'
    );
  });

  test('parseYouTubeUrl: rejects playlists', () => {
    const res = parseYouTubeUrl('https://www.youtube.com/watch?v=abc&list=PL123');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain('播放清單');
  });

  test('parseYouTubeUrl: rejects non-YouTube hosts', () => {
    const res = parseYouTubeUrl('https://example.com/watch?v=abc');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain('YouTube');
  });
});
