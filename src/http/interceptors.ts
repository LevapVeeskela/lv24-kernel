import { HttpRequestOptions, HttpResponse } from './http-client.interface.js';

/**
 * Request interceptor — перехватывает запрос ДО отправки.
 */
export interface RequestInterceptor {
  /**
   * Обработка запроса перед отправкой.
   *
   * @param options - Опции запроса
   * @returns Модифицированные опции запроса (или Promise)
   */
  onRequest(
    options: HttpRequestOptions,
  ): HttpRequestOptions | Promise<HttpRequestOptions>;
}

/**
 * Response interceptor — перехватывает ответ ПОСЛЕ получения.
 */
export interface ResponseInterceptor {
  /**
   * Обработка успешного ответа.
   *
   * @param response - HTTP ответ
   * @param request - Исходный запрос (для контекста)
   * @returns Модифицированный ответ (или Promise)
   */
  onResponse(
    response: HttpResponse,
    request: HttpRequestOptions,
  ): HttpResponse | Promise<HttpResponse>;

  /**
   * Обработка ошибки (опционально).
   *
   * Может вернуть HttpResponse вместо выбрасывания исключения
   * для обработки ошибок в стиле Result<T>.
   *
   * @param error - Исключение
   * @param request - Исходный запрос
   * @returns HttpResponse или Promise<HttpResponse> для обработки ошибки
   */
  onError?(
    error: Error,
    request: HttpRequestOptions,
  ): HttpResponse | Promise<HttpResponse>;
}

/**
 * Контекст выполнения запроса.
 * Хранит состояние для цепочки interceptors.
 */
export interface RequestPipelineContext {
  /** Исходные опции запроса */
  request: HttpRequestOptions;

  /** Полученный ответ (если есть) */
  response?: HttpResponse;

  /** Ошибка (если есть) */
  error?: Error;

  /** Количество попыток выполнения */
  attempt: number;

  /** Метаданные для interceptors */
  metadata: Record<string, unknown>;
}

/**
 * Проверить, является ли ошибка retry-ошибкой от rate-limit interceptor.
 *
 * Конвенция: interceptor бросает Error с флагом `__retry === true`,
 * pipeline перехватывает его и повторяет запрос.
 */
export function isRetryError(error: Error): error is Error & { __retry: boolean } {
  return (error as Error & { __retry: boolean }).__retry === true;
}

/**
 * Создать retry-ошибку (просит pipeline повторить запрос).
 */
export function createRetryError(message: string): Error {
  const retryError = new Error(message);
  (retryError as Error & { __retry: boolean }).__retry = true;
  return retryError;
}
