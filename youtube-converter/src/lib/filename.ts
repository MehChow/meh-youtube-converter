export function sanitizeFilename(name: string) {
  // Android/MediaStore is generally fine with Unicode; we only remove illegal path chars.
  // Keep spaces; only replace reserved characters and trim.
  return String(name || 'audio.mp3')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

