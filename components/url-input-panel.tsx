'use client';

import { ClipboardPaste, Loader2, Search } from 'lucide-react';

type Props = {
  value: string;
  disabled: boolean;
  analyzing: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onPaste: () => void;
};

export function UrlInputPanel({ value, disabled, analyzing, onChange, onAnalyze, onPaste }: Props) {
  return (
    <section className="glass-panel mb-6 rounded-2xl p-4 sm:p-5">
      <label htmlFor="url" className="mb-2 block text-xs uppercase tracking-wide text-slate-300">
        Media or YouTube URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://example.com/media/video.mp4"
          className="h-12 flex-1 rounded-xl border border-white/15 bg-slate-900/40 px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-indigo-300 transition focus:border-indigo-300/40 focus:ring"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            type="button"
            onClick={onPaste}
            disabled={disabled}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClipboardPaste className="h-4 w-4" /> Paste
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || analyzing}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze
          </button>
        </div>
      </div>
    </section>
  );
}
