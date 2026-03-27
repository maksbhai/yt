import { AppError } from '@/lib/errors';
import type { MediaFormat, MediaInfo } from '@/lib/types/media';
import { guessExtFromMime, parseHttpUrl, sanitizeFileName } from '@/lib/utils/media';

const DIRECT_MEDIA_EXTS = ['.mp4', '.webm', '.mov', '.m4v', '.mp3', '.wav', '.m4a', '.ogg'];
const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const SUPPORTED_AUDIO_MIME = /audio\//i;
const SUPPORTED_VIDEO_MIME = /video\//i;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be'
]);

type YouTubeFormat = {
  itag: number;
  url?: string;
  mimeType?: string;
  qualityLabel?: string;
  contentLength?: string;
  bitrate?: number;
  audioQuality?: string;
};

type YouTubeResolved = {
  title: string;
  thumbnail?: string;
  formats: YouTubeFormat[];
};

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

function parseYouTubeId(parsed: URL): string | null {
  if (!YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  if (parsed.hostname.includes('youtu.be')) {
    const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
    return id || null;
  }

  if (parsed.pathname === '/watch') {
    return parsed.searchParams.get('v');
  }

  if (parsed.pathname.startsWith('/shorts/')) {
    return parsed.pathname.split('/')[2] || null;
  }

  if (parsed.pathname.startsWith('/embed/')) {
    return parsed.pathname.split('/')[2] || null;
  }

  return null;
}

async function resolveYouTube(videoId: string): Promise<YouTubeResolved> {
  const infoUrl = `https://www.youtube.com/get_video_info?video_id=${encodeURIComponent(videoId)}&el=detailpage&hl=en`;
  const res = await fetch(infoUrl, { redirect: 'follow' });

  if (!res.ok) {
    throw new AppError('ANALYZE_FAILED', `YouTube request failed with HTTP ${res.status}.`, 422);
  }

  const body = await res.text();
  const params = new URLSearchParams(body);
  const playerRaw = params.get('player_response');

  if (!playerRaw) {
    throw new AppError('ANALYZE_FAILED', 'Could not read YouTube video metadata.', 422);
  }

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerRaw);
  } catch {
    throw new AppError('ANALYZE_FAILED', 'Could not parse YouTube response.', 422);
  }

  const status = playerResponse?.playabilityStatus?.status;
  if (status && status !== 'OK') {
    const reason = playerResponse?.playabilityStatus?.reason ?? 'Video is not playable.';
    throw new AppError('UNSUPPORTED_SOURCE', reason, 400);
  }

  const streamingFormats: YouTubeFormat[] = [
    ...(playerResponse?.streamingData?.formats ?? []),
    ...(playerResponse?.streamingData?.adaptiveFormats ?? [])
  ];

  const formats = streamingFormats.filter((fmt) => Boolean(fmt?.url));
  if (!formats.length) {
    throw new AppError(
      'UNSUPPORTED_SOURCE',
      'No direct YouTube stream URLs are available for this video right now.',
      400
    );
  }

  return {
    title: playerResponse?.videoDetails?.title ?? `youtube-${videoId}`,
    thumbnail: playerResponse?.videoDetails?.thumbnail?.thumbnails?.at(-1)?.url,
    formats
  };
}

function pickYoutubeFormat(formats: YouTubeFormat[], format: MediaFormat): YouTubeFormat | null {
  if (format === 'video') {
    const videoFormats = formats.filter((f) => f.mimeType?.includes('video/'));
    if (!videoFormats.length) return null;
    return videoFormats.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0] ?? null;
  }

  const audioFormats = formats.filter((f) => f.mimeType?.includes('audio/'));
  if (!audioFormats.length) return null;
  return audioFormats.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0] ?? null;
}

export async function analyzeMedia(url: string): Promise<MediaInfo> {
  const parsed = parseHttpUrl(url);
  const youtubeId = parseYouTubeId(parsed);

  if (youtubeId) {
    const yt = await resolveYouTube(youtubeId);
    const hasVideo = yt.formats.some((f) => f.mimeType?.includes('video/'));
    const hasAudio = yt.formats.some((f) => f.mimeType?.includes('audio/'));
    const preferred = pickYoutubeFormat(yt.formats, hasVideo ? 'video' : 'audio');
    const mimeType = preferred?.mimeType?.split(';')[0];
    const ext = guessExtFromMime(mimeType) || (hasVideo ? '.mp4' : '.mp3');
    const base = sanitizeFileName(yt.title, `youtube-${youtubeId}`);

    return {
      sourceUrl: parsed.toString(),
      title: yt.title,
      fileName: `${base}${ext}`,
      mimeType,
      previewUrl: undefined,
      canDownloadVideo: hasVideo,
      canDownloadAudio: hasAudio
    };
  }

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
  const parsed = parseHttpUrl(url);
  const youtubeId = parseYouTubeId(parsed);

  if (youtubeId) {
    const yt = await resolveYouTube(youtubeId);
    const selected = pickYoutubeFormat(yt.formats, format);

    if (!selected?.url) {
      throw new AppError('DOWNLOAD_FAILED', `${format === 'video' ? 'Video' : 'Audio'} format is unavailable.`, 400);
    }

    const mimeType = selected.mimeType?.split(';')[0];
    const ext = guessExtFromMime(mimeType) || (format === 'video' ? '.mp4' : '.mp3');
    const base = sanitizeFileName(yt.title, `youtube-${youtubeId}`);
    const sizeBytes = selected.contentLength ? Number(selected.contentLength) : undefined;

    return {
      downloadUrl: selected.url,
      fileName: `${base}${ext}`,
      format,
      mimeType,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined
    };
  }

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
