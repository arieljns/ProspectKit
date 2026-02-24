export type ServiceError<Code extends string = string> = {
  code: Code;
  message: string;
  details?: unknown;
};

export type ServiceResult<T, Code extends string = string> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError<Code> };

export const ok = <T>(data: T): ServiceResult<T, never> => ({
  ok: true,
  data,
});

export const err = <Code extends string>(
  code: Code,
  message: string,
  details?: unknown,
): ServiceResult<never, Code> => ({
  ok: false,
  error: { code, message, details },
});
