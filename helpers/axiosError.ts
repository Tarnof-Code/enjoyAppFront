import { AxiosError } from 'axios';

export const NETWORK_ERROR_MESSAGE =
  "Impossible de joindre le serveur. Vérifiez votre connexion internet ou réessayez dans quelques instants.";

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError && !error.response) {
    return true;
  }
  if (error && typeof error === 'object') {
    const candidate = error as { code?: string; message?: string; response?: unknown };
    if (!candidate.response && candidate.code === 'ERR_NETWORK') {
      return true;
    }
  }
  return false;
}

export function getUserFacingErrorMessage(error: unknown, whenUnknown: string): string {
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }
  return whenUnknown;
}

export function getApiErrorMessage(errorData: unknown, whenUnknown: string): string {
  return extractErrorMessage(errorData, whenUnknown, whenUnknown);
}

function extractErrorMessage(
  errorData: unknown,
  defaultMessage: string,
  validationDefault?: string,
): string {
  if (!errorData || typeof errorData !== 'object') {
    return defaultMessage;
  }
  const data = errorData as Record<string, unknown>;
  const msg = data.message;
  if (typeof msg === 'string' && msg.trim() !== '') {
    return msg;
  }
  if (data.error && typeof data.error === 'string') {
    return data.error;
  }
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length > 0) {
    const validationErrors = entries
      .map(([field, message]) => {
        const m = Array.isArray(message) ? message.join(', ') : String(message);
        return `${field}: ${m}`;
      })
      .join(', ');
    return `Erreurs de validation : ${validationErrors}`;
  }
  return validationDefault ?? defaultMessage;
}

export interface AdaptAxiosErrorOptions {
  defaultMessage: string;
  validationDefault?: string;
  logContext?: string;
  preserveResponseData?: boolean;
}

export interface AdaptedError extends Error {
  response?: {
    status: number;
    data: unknown;
    [key: string]: unknown;
  };
}

export function adaptAxiosError(error: unknown, options: AdaptAxiosErrorOptions): never {
  const { defaultMessage, validationDefault, logContext, preserveResponseData = false } = options;

  if (logContext) {
    console.error(logContext, error);
  }

  const axiosError = error as { response?: { status: number; data: unknown; [key: string]: unknown } };
  if (!axiosError.response) {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  const errorMessage = extractErrorMessage(
    axiosError.response.data,
    defaultMessage,
    validationDefault ?? defaultMessage,
  );

  const adaptedError = new Error(errorMessage) as AdaptedError;
  adaptedError.response = {
    ...axiosError.response,
    status: axiosError.response.status,
    data: preserveResponseData ? axiosError.response.data : { error: errorMessage },
  };

  throw adaptedError;
}
