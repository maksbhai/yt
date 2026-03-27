import { AppError } from '@/lib/errors';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function parseHttpUrl(raw: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new AppError('INVALID_URL', 'Please enter a valid URL.', 400);
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new AppError('UNSUPPORTED_SOURCE', 'Only http/https URLs are supported.', 400);
  }

  return parsed;
}

export function sanitizeFileName(input: string, fallback: string): string {
  const base = (input || fallback)
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

  return base || fallback;
}

export function guessExtFromMime(mime?: string): string {
  if (!mime) return '';
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('mpeg') || mime.includes('mp3')) return '.mp3';
  if (mime.includes('wav')) return '.wav';
  if (mime.includes('ogg')) return '.ogg';
  return '';
}

export function formatBytes(bytes?: number): string {
  if (!bytes || Number.isNaN(bytes)) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;

  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }

  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}
