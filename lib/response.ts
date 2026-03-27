import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import type { ApiErrorResponse } from '@/lib/types/media';

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    const body: ApiErrorResponse = {
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    };

    return NextResponse.json(body, { status: error.statusCode });
  }

  const body: ApiErrorResponse = {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error. Please try again.'
    }
  };

  return NextResponse.json(body, { status: 500 });
}
