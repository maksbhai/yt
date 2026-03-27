'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={reduced ? undefined : { opacity: 0, y: 22 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mb-8 text-center"
    >
      <p className="mb-3 inline-flex rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs tracking-wide text-blue-200">
        Lawful direct media downloader
      </p>
      <h1 className="bg-gradient-to-r from-slate-50 via-blue-100 to-indigo-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
        Media Hub Lite
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
        Fast MVP for user-owned or user-permitted direct media URLs. Analyze instantly, pick video or audio, and
        download with smooth real-time feedback.
      </p>
    </motion.section>
  );
}
