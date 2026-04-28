import * as IntentLauncher from 'expo-intent-launcher';
import RNBlobUtil from 'react-native-blob-util';

import { sanitizeFilename } from './filename';

export async function openAndroidDownloads() {
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW_DOWNLOADS');
  } catch {
    // ignore
  }
}

export async function downloadToDownloadsFolder({
  url,
  filename,
  apiKey,
}: {
  url: string;
  filename: string;
  apiKey: string;
}) {
  const safeFilename = sanitizeFilename(filename);

  const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${Date.now()}-${safeFilename}`;
  const resDownload = await RNBlobUtil.config({
    fileCache: true,
    path: tempPath,
  }).fetch('GET', url, { 'x-api-key': apiKey });

  const info = resDownload.info();
  if (Number(info?.status || 0) !== 200) {
    if (Number(info?.status || 0) === 401) {
      throw new Error('下載失敗：API 金鑰不正確。');
    }
    throw new Error('下載失敗，請稍後再試。');
  }

  const downloadedPath = resDownload.path();
  const st = await RNBlobUtil.fs.stat(downloadedPath);
  const size = Number(st?.size || 0);
  if (!size) throw new Error('下載失敗：檔案是空的。請重新轉換後再試。');

  await RNBlobUtil.MediaCollection.copyToMediaStore(
    { name: safeFilename, parentFolder: '', mimeType: 'audio/mpeg' },
    'Download',
    downloadedPath
  );

  await RNBlobUtil.fs.unlink(downloadedPath).catch(() => {});
  return { safeFilename };
}
