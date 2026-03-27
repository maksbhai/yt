'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function AppShell({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-[-10%] h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
        animate={reduced ? undefined : { y: [0, 18, 0], x: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        animate={reduced ? undefined : { y: [0, -16, 0], x: [0, 14, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}
