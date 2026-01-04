import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Error codes as defined in API.md
export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: ValidationDetail[];
}

export interface ErrorResponse {
  error: ApiError;
}

// Custom error class for API errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ValidationDetail[];

  constructor(statusCode: number, code: ErrorCode, message: string, details?: ValidationDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static validation(message: string, details: ValidationDetail[]): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static notFound(message: string): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static internal(message: string): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}

// Convert Zod errors to our validation details format
function formatZodError(error: z.ZodError): ValidationDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

// Error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void {
  // Handle Zod validation errors (works with Zod 4.x)
  if (err instanceof z.ZodError) {
    const details = formatZodError(err);
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
    return;
  }

  // Handle our custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Prisma unique constraint errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `A record with this ${field} already exists`,
        },
      });
      return;
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Generic internal server error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

// Async handler wrapper to catch errors in async route handlers
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
