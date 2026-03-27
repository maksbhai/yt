import { AppError } from '@/lib/errors';
import type { MediaFormat, MediaInfo } from '@/lib/types/media';
import { guessExtFromMime, parseHttpUrl, sanitizeFileName } from '@/lib/utils/media';

const DIRECT_MEDIA_EXTS = ['.mp4', '.webm', '.mov', '.m4v', '.mp3', '.wav', '.m4a', '.ogg'];
const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const SUPPORTED_AUDIO_MIME = /audio\//i;
const SUPPORTED_VIDEO_MIME = /video\//i;

async function headWithTimeout(url: string, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('TIMEOUT', 'Source timed out during analysis.', 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function extFromPath(pathname: string): string {
  const lowerPath = pathname.toLowerCase();
  const match = DIRECT_MEDIA_EXTS.find((ext) => lowerPath.endsWith(ext));
  return match ?? '';
}

function inferMime(ext: string): string | undefined {
  if (['.mp4', '.mov', '.m4v'].includes(ext)) return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.ogg') return 'audio/ogg';
  return undefined;
}

export async function analyzeMedia(url: string): Promise<MediaInfo> {
  const parsed = parseHttpUrl(url);
  const ext = extFromPath(parsed.pathname);
  let response: Response | undefined;

  try {
    response = await headWithTimeout(parsed.toString());
  } catch {
    // Gracefully continue with extension-only inference.
  }

  const status = response?.status;
  if (status && status >= 400) {
    throw new AppError('ANALYZE_FAILED', `Source URL returned HTTP ${status}.`, 422);
  }

  const mimeType = response?.headers.get('content-type')?.split(';')[0] ?? inferMime(ext);
  const sizeRaw = response?.headers.get('content-length');
  const sizeBytes = sizeRaw ? Number(sizeRaw) : undefined;

  const isVideo = Boolean(ext && !AUDIO_EXTS.includes(ext)) || Boolean(mimeType && SUPPORTED_VIDEO_MIME.test(mimeType));
  const isAudio = AUDIO_EXTS.includes(ext) || Boolean(mimeType && SUPPORTED_AUDIO_MIME.test(mimeType));

  if (!ext && !isVideo && !isAudio) {
    throw new AppError(
      'UNSUPPORTED_SOURCE',
      'Only direct media file URLs are supported (e.g. .mp4, .webm, .mp3, .m4a).',
      400
    );
  }

  const pathPart = parsed.pathname.split('/').pop() || 'media-file';
  const cleanedBase = sanitizeFileName(decodeURIComponent(pathPart), 'media-file');
  const inferredExt = ext || guessExtFromMime(mimeType) || '.bin';

  return {
    sourceUrl: parsed.toString(),
    title: cleanedBase.replace(/[-_]/g, ' '),
    fileName: `${cleanedBase}${inferredExt}`,
    mimeType,
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
    previewUrl: isVideo ? parsed.toString() : undefined,
    canDownloadVideo: isVideo,
    canDownloadAudio: isAudio || isVideo
  };
}

export async function createDownload(url: string, format: MediaFormat) {
  const analyzed = await analyzeMedia(url);

  if (format === 'video' && !analyzed.canDownloadVideo) {
    throw new AppError('DOWNLOAD_FAILED', 'Video format is unavailable for this source.', 400);
  }

  if (format === 'audio' && !analyzed.canDownloadAudio) {
    throw new AppError('DOWNLOAD_FAILED', 'Audio format is unavailable for this source.', 400);
  }

  // For lawful direct URLs we stream/source directly for max speed.
  // Audio extraction/transcoding is intentionally not done server-side in this MVP.
  // If the source is video, audio download is still offered as source-provided media when possible.
  const fallbackExt = format === 'audio' ? '.mp3' : '.mp4';
  const base = sanitizeFileName(analyzed.title, 'download');

  return {
    downloadUrl: analyzed.sourceUrl,
    fileName: `${base}${guessExtFromMime(analyzed.mimeType) || fallbackExt}`,
    format,
    mimeType: analyzed.mimeType,
    sizeBytes: analyzed.sizeBytes
  };
}
