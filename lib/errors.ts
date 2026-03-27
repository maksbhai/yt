export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'INVALID_URL'
  | 'UNSUPPORTED_SOURCE'
  | 'ANALYZE_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;

  constructor(code: AppErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
