import { useMutation, useQuery } from '@tanstack/react-query';

import { convertYouTubeUrl, previewYouTubeUrl } from '@/src/lib/api';
import { downloadToDownloadsFolder } from '@/src/lib/downloads';
import { parseYouTubeUrl } from '@/src/lib/validation/youtubeUrl';

export function usePreviewQuery(urlInput: string) {
  const parsed = parseYouTubeUrl(urlInput);
  const normalizedUrl = parsed.ok ? parsed.url : '';

  return useQuery({
    queryKey: ['preview', normalizedUrl],
    enabled: false,
    queryFn: async () => {
      if (!normalizedUrl) throw new Error(parsed.ok ? '缺少 URL' : parsed.message);
      return previewYouTubeUrl(normalizedUrl);
    },
  });
}

export function useConvertAndDownloadMutation() {
  return useMutation({
    mutationKey: ['convertAndDownload'],
    mutationFn: async ({ urlInput }: { urlInput: string }) => {
      const parsed = parseYouTubeUrl(urlInput);
      if (!parsed.ok) throw new Error(parsed.message);

      const { fullUrl, filename, apiKey } = await convertYouTubeUrl(parsed.url);
      await downloadToDownloadsFolder({ url: fullUrl, filename, apiKey });
      return { filename };
    },
  });
}

