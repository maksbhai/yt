'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Download, FileAudio, FileVideo, HardDrive, Link2 } from 'lucide-react';
import type { MediaFormat, MediaInfo } from '@/lib/types/media';
import { formatBytes } from '@/lib/utils/media';

type Props = {
  media: MediaInfo;
  selectedFormat: MediaFormat;
  downloading: boolean;
  progress: number;
  statusText: string;
  onSelectFormat: (format: MediaFormat) => void;
  onDownload: () => void;
};

export function MediaResultCard({
  media,
  selectedFormat,
  downloading,
  progress,
  statusText,
  onSelectFormat,
  onDownload
}: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={reduced ? undefined : { opacity: 0, y: 15 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel space-y-5 rounded-2xl p-6"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-100">{media.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5" />
              {formatBytes(media.sizeBytes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5" />
              {media.fileName}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center rounded-lg border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-amber-100">
          lawful source only
        </span>
      </div>

      {media.previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <video src={media.previewUrl} controls className="max-h-72 w-full bg-black/30" preload="metadata" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
          Preview unavailable for this media type.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!media.canDownloadVideo || downloading}
          onClick={() => onSelectFormat('video')}
          className={`group flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition hover:-translate-y-0.5 ${
            selectedFormat === 'video'
              ? 'border-blue-300/50 bg-blue-500/20 text-blue-100 shadow-glow'
              : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <FileVideo className="h-4 w-4" /> Video
        </button>
        <button
          type="button"
          disabled={!media.canDownloadAudio || downloading}
          onClick={() => onSelectFormat('audio')}
          className={`group flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition hover:-translate-y-0.5 ${
            selectedFormat === 'audio'
              ? 'border-indigo-300/50 bg-indigo-500/20 text-indigo-100 shadow-glow'
              : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <FileAudio className="h-4 w-4" /> Audio
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>{statusText}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>

      <button
        onClick={onDownload}
        type="button"
        disabled={downloading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
        {downloading ? 'Preparing download…' : `Download ${selectedFormat === 'audio' ? 'Audio' : 'Video'}`}
      </button>
    </motion.section>
  );
}
