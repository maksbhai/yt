import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').url('Please enter a valid URL.')
});

export const downloadRequestSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').url('Please enter a valid URL.'),
  format: z.enum(['video', 'audio'])
});
