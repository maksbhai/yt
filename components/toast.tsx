'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  tone: ToastTone;
  visible: boolean;
};

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-100',
  error: 'border-rose-400/25 bg-rose-500/15 text-rose-100',
  info: 'border-blue-400/25 bg-blue-500/15 text-blue-100'
};

const toneIcon: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info
};

export function Toast({ message, tone, visible }: ToastProps) {
  const Icon = toneIcon[tone];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl ${toneStyles[tone]}`}
          role="status"
        >
          <Icon className="mt-0.5 h-4 w-4" />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
