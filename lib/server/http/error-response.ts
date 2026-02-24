import type { ServiceError } from "@/lib/server/shared/result";

const STATUS_BY_ERROR_CODE: Record<string, number> = {
  INVALID_INPUT: 400,
  NO_CONTACTS_FOUND: 404,
  AI_GENERATION_FAILED: 502,
  DB_WRITE_FAILED: 500,
  UNKNOWN: 500,
};

export function mapServiceErrorToStatusCode(code: string): number {
  if (STATUS_BY_ERROR_CODE[code]) {
    return STATUS_BY_ERROR_CODE[code];
  }

  if (code.endsWith("_NOT_FOUND") || code.endsWith("_MISSING")) {
    return 404;
  }

  return 500;
}

export function toServiceJsonErrorBody(
  error: ServiceError,
  options?: { includeDetailsAsData?: boolean },
) {
  const body: { success: false; error: string; data?: unknown } = {
    success: false,
    error: error.message,
  };

  if (options?.includeDetailsAsData && error.details !== undefined) {
    body.data = error.details;
  }

  return body;
}

export function toServiceJsonErrorResponse(
  error: ServiceError,
  options?: { includeDetailsAsData?: boolean },
) {
  return Response.json(toServiceJsonErrorBody(error, options), {
    status: mapServiceErrorToStatusCode(error.code),
  });
}

export function toServiceTextErrorResponse(error: ServiceError) {
  return new Response(error.message, {
    status: mapServiceErrorToStatusCode(error.code),
  });
}
