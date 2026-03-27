import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { errorResponse } from '@/lib/response';
import { downloadRequestSchema } from '@/lib/schemas/media';
import { createDownload } from '@/lib/services/media-service';
import type { DownloadResponse } from '@/lib/types/media';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = downloadRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError('BAD_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid request body.', 400);
    }

    const download = await createDownload(parsed.data.url, parsed.data.format);
    const response: DownloadResponse = {
      ok: true,
      ...download
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
