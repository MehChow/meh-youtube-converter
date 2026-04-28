import { useMemo, useState } from 'react';

import { openAndroidDownloads } from '@/src/lib/downloads';
import { parseYouTubeUrl } from '@/src/lib/validation/youtubeUrl';
import { queryClient } from '@/src/lib/queryClient';
import { useConvertAndDownloadMutation, usePreviewQuery } from './convert.queries';

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useConvertAndDownload() {
  const [url, setUrl] = useState('');
  const [lastFilename, setLastFilename] = useState('');

  const parsedUrl = useMemo(() => parseYouTubeUrl(url), [url]);
  const canConvert = parsedUrl.ok;

  const previewQuery = usePreviewQuery(url);
  const convertMutation = useConvertAndDownloadMutation();

  const isConverting = convertMutation.isPending;
  const previewStatus: PreviewStatus = previewQuery.isFetching
    ? 'loading'
    : previewQuery.data
      ? 'ready'
      : previewQuery.error
        ? 'error'
        : 'idle';

  const previewData = previewQuery.data ?? null;

  const message =
    (previewQuery.error instanceof Error ? previewQuery.error.message : '') ||
    (convertMutation.error instanceof Error ? convertMutation.error.message : '');

  const clearPreview = () => {
    queryClient.removeQueries({ queryKey: ['preview'], exact: false });
  };

  const clearUrl = () => setUrl('');

  const resetAll = () => {
    setUrl('');
    setLastFilename('');
    clearPreview();
    convertMutation.reset();
  };

  const requestPreview = async () => {
    if (!parsedUrl.ok) return;
    await previewQuery.refetch();
  };

  const convertAndDownload = async () => {
    if (!parsedUrl.ok) return;
    const res = await convertMutation.mutateAsync({ urlInput: url });
    setLastFilename(res.filename);
    setUrl('');
    clearPreview();
  };

  return {
    url,
    setUrl,
    clearUrl,
    resetAll,
    message,
    lastFilename,
    previewStatus,
    previewData,
    canConvert,
    isConverting,
    requestPreview,
    clearPreview,
    convertAndDownload,
    openAndroidDownloads,
  };
}
