export type MediaFormat = 'video' | 'audio';

export type AnalyzeRequest = {
  url: string;
};

export type AnalyzeResponse = {
  ok: true;
  media: MediaInfo;
};

export type DownloadRequest = {
  url: string;
  format: MediaFormat;
};

export type DownloadResponse = {
  ok: true;
  downloadUrl: string;
  fileName: string;
  format: MediaFormat;
  mimeType?: string;
  sizeBytes?: number;
};

export type MediaInfo = {
  sourceUrl: string;
  title: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  previewUrl?: string;
  canDownloadVideo: boolean;
  canDownloadAudio: boolean;
};

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};
