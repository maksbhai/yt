import { NextRequest, NextResponse } from 'next/server';
import { analyzeRequestSchema } from '@/lib/schemas/media';
import { analyzeMedia } from '@/lib/services/media-service';
import { AppError } from '@/lib/errors';
import { errorResponse } from '@/lib/response';
import type { AnalyzeResponse } from '@/lib/types/media';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError('BAD_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid request body.', 400);
    }

    const media = await analyzeMedia(parsed.data.url);
    const response: AnalyzeResponse = {
      ok: true,
      media
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
