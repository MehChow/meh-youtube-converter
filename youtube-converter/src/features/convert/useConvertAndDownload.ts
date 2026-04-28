import { useMemo, useState } from 'react';

import { convertYouTubeUrl, previewYouTubeUrl } from '@/src/lib/api';
import { downloadToDownloadsFolder, openAndroidDownloads } from '@/src/lib/downloads';

type Status = 'idle' | 'converting' | 'done' | 'error';
type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

type PreviewData = {
  title: string;
  uploader: string;
  durationSeconds: number | null;
  webpageUrl: string;
  thumbnailUrl: string;
};

export function useConvertAndDownload() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [lastFilename, setLastFilename] = useState('');
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const canConvert = useMemo(() => {
    const trimmed = url.trim();
    if (trimmed.length < 10) return false;
    // Allow common YouTube URL formats; the backend/API will do final validation.
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
  }, [url]);

  const isConverting = useMemo(() => status === 'converting', [status]);

  const clearPreview = () => {
    setPreviewStatus('idle');
    setPreviewUrl('');
    setPreviewData(null);
  };

  const setUrlAndMaybeClearPreview = (next: string) => {
    setUrl(next);
    if (previewStatus === 'ready' && previewUrl && next.trim() !== previewUrl) {
      clearPreview();
    }
  };

  const clearUrl = () => setUrlAndMaybeClearPreview('');

  const resetAll = () => {
    setUrl('');
    setStatus('idle');
    setMessage('');
    setLastFilename('');
    clearPreview();
  };

  const requestPreview = async () => {
    try {
      const trimmed = url.trim();
      if (!trimmed) return;
      setPreviewStatus('loading');
      setMessage('');

      const data = await previewYouTubeUrl(trimmed);
      setPreviewData(data);
      setPreviewUrl(trimmed);
      setPreviewStatus('ready');
    } catch (e) {
      setPreviewStatus('error');
      setPreviewData(null);
      setPreviewUrl('');
      setMessage(e instanceof Error ? e.message : '發生未知錯誤。');
    }
  };

  const convertAndDownload = async () => {
    try {
      setStatus('converting');
      setMessage('');
      setLastFilename('');

      const trimmed = url.trim();
      const { fullUrl, filename, apiKey } = await convertYouTubeUrl(trimmed);
      await downloadToDownloadsFolder({ url: fullUrl, filename, apiKey });

      setLastFilename(filename);
      setStatus('done');
      setUrl('');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : '發生未知錯誤。');
    }
  };

  return {
    url,
    setUrl: setUrlAndMaybeClearPreview,
    clearUrl,
    resetAll,
    status,
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

