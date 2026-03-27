'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheckBig, CloudOff, SearchX } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { HeroSection } from '@/components/hero-section';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { MediaResultCard } from '@/components/media-result-card';
import { Toast, type ToastTone } from '@/components/toast';
import { UrlInputPanel } from '@/components/url-input-panel';
import type { AnalyzeResponse, ApiErrorResponse, DownloadResponse, MediaFormat, MediaInfo } from '@/lib/types/media';

type UiStatus = 'idle' | 'loading' | 'ready' | 'error' | 'success';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat>('video');
  const [uiStatus, setUiStatus] = useState<UiStatus>('idle');
  const [statusText, setStatusText] = useState('Ready');
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone; visible: boolean }>({
    message: '',
    tone: 'info',
    visible: false
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone, visible: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const analyzing = uiStatus === 'loading';
  const downloading = uiStatus === 'success' && progress > 0 && progress < 100;

  const canAnalyze = useMemo(() => url.trim().length > 0 && !analyzing && !downloading, [url, analyzing, downloading]);

  const analyze = useCallback(async () => {
    if (!url.trim()) {
      showToast('Please paste a URL first.', 'error');
      return;
    }

    setUiStatus('loading');
    setMedia(null);
    setProgress(5);
    setStatusText('Analyzing source...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = (await response.json()) as AnalyzeResponse | ApiErrorResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? 'Analyze failed.' : data.error.message);
      }

      setMedia(data.media);
      setSelectedFormat(data.media.canDownloadVideo ? 'video' : 'audio');
      setUiStatus('ready');
      setProgress(100);
      setStatusText('Analysis complete');
      showToast('Media analyzed successfully.', 'success');
    } catch (error) {
      setUiStatus('error');
      setProgress(0);
      setStatusText('Analyze failed');
      showToast(error instanceof Error ? error.message : 'Network error during analysis.', 'error');
    }
  }, [showToast, url]);

  const simulateProgress = useCallback(() => {
    setProgress(8);
    let value = 8;
    const interval = setInterval(() => {
      value = Math.min(90, value + Math.floor(Math.random() * 14));
      setProgress(value);
      if (value >= 90) clearInterval(interval);
    }, 180);
    return interval;
  }, []);

  const startDownload = useCallback(async () => {
    if (!media) return;

    setUiStatus('success');
    setStatusText('Preparing download...');
    const interval = simulateProgress();

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: media.sourceUrl, format: selectedFormat })
      });

      const data = (await response.json()) as DownloadResponse | ApiErrorResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? 'Download failed.' : data.error.message);
      }

      setStatusText('Starting browser download...');
      setProgress(100);

      const anchor = document.createElement('a');
      anchor.href = data.downloadUrl;
      anchor.download = data.fileName;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      showToast(`${selectedFormat === 'audio' ? 'Audio' : 'Video'} download started.`, 'success');
      setStatusText('Download started');
    } catch (error) {
      setUiStatus('error');
      setProgress(0);
      setStatusText('Download failed');
      showToast(error instanceof Error ? error.message : 'Network error during download.', 'error');
    } finally {
      clearInterval(interval);
    }
  }, [media, selectedFormat, showToast, simulateProgress]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast('Clipboard is empty.', 'info');
        return;
      }
      setUrl(text.trim());
      showToast('URL pasted from clipboard.', 'success');
    } catch {
      showToast('Clipboard access blocked by browser.', 'error');
    }
  }, [showToast]);

  return (
    <AppShell>
      <HeroSection />
      <UrlInputPanel
        value={url}
        onChange={setUrl}
        onAnalyze={analyze}
        onPaste={pasteFromClipboard}
        analyzing={analyzing}
        disabled={downloading}
      />

      <AnimatePresence mode="wait">
        {uiStatus === 'loading' ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        ) : null}

        {media && uiStatus !== 'loading' ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MediaResultCard
              media={media}
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
              downloading={downloading}
              progress={progress}
              statusText={statusText}
              onDownload={startDownload}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!media && uiStatus === 'idle' ? (
        <div className="glass-panel mt-4 rounded-2xl p-6 text-center text-slate-300">
          <SearchX className="mx-auto mb-2 h-6 w-6 text-blue-200" />
          Paste a direct media URL, click Analyze, then choose video or audio download.
        </div>
      ) : null}

      {uiStatus === 'error' ? (
        <div className="glass-panel mt-4 rounded-2xl border-rose-300/20 bg-rose-500/10 p-6 text-center text-rose-100">
          <CloudOff className="mx-auto mb-2 h-6 w-6" />
          Something went wrong. Check the URL/source and try again.
        </div>
      ) : null}

      {uiStatus === 'success' && progress === 100 ? (
        <motion.div
          className="glass-panel mt-4 rounded-2xl border-emerald-300/20 bg-emerald-500/10 p-6 text-center text-emerald-100"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CircleCheckBig className="mx-auto mb-2 h-6 w-6" />
          Download initiated successfully.
        </motion.div>
      ) : null}

      <Toast message={toast.message} tone={toast.tone} visible={toast.visible} />

      <div className="mt-6 text-center text-xs text-slate-400">
        Only use Media Hub Lite for media you own or are explicitly authorized to download.
      </div>

      <div className="sr-only">{canAnalyze ? 'ready' : 'not ready'}</div>
    </AppShell>
  );
}
