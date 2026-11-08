import type { ResponseInterceptor } from './interceptors.js';
import type { HttpRequestOptions, HttpResponse } from './http-client.interface.js';
import { ResponseType } from '../result/response-type.js';

/**
 * Опции для ErrorInterceptor.
 */
export interface ErrorInterceptorOptions {
  /** Логировать ошибки (по умолчанию true) */
  logErrors?: boolean;

  /** Функция для логирования */
  logger?: (message: string, error?: Error) => void;
}

/**
 * Error Interceptor — обрабатывает ошибки Instagram API.
 *
 * НЕ бросает исключения — вместо этого модифицирует HttpResponse
 * для последующей обработки в стиле Result.
 *
 * Маппинг ошибок:
 * - 429 → RequestsLimit
 * - 404 → NotFound
 * - 401 → LoginRequired
 * - 400 + challenge_required → ChallengeRequired
 * - 400 + spam → Spam
 * - 500+ → InternalError
 */
export class ErrorInterceptor implements ResponseInterceptor {
  private options: Required<ErrorInterceptorOptions>;

  constructor(options: ErrorInterceptorOptions = {}) {
    this.options = {
      logErrors: options.logErrors ?? true,
      logger: options.logger ?? console.error,
    };
  }

  onResponse(
    response: HttpResponse,
    _request: HttpRequestOptions,
  ): HttpResponse {
    const { statusCode, body } = response;

    // Проверяем на ошибки
    const errorInfo = this.extractErrorInfo(statusCode, body as Record<string, unknown>);

    if (errorInfo && this.options.logErrors) {
      this.options.logger(
        `Instagram API Error: ${errorInfo.message} (Status: ${statusCode}, Type: ${errorInfo.type})`,
      );
    }

    // Добавляем метаданные ошибки в заголовки для последующей обработки
    if (errorInfo) {
      const modifiedHeaders = {
        ...response.headers,
        'x-instaagent-error-type': errorInfo.type,
        'x-instaagent-error-message': encodeURIComponent(errorInfo.message),
      };

      return {
        ...response,
        headers: modifiedHeaders,
      };
    }

    return response;
  }

  onError(
    error: Error,
    request: HttpRequestOptions,
  ): HttpResponse | Promise<HttpResponse> {
    if (this.options.logErrors) {
      this.options.logger(`Request error: ${error.message}`, error);
    }

    // Создаём фиктивный HttpResponse для обработки ошибки
    const errorResponse: HttpResponse = {
      statusCode: 0,
      headers: {},
      body: {
        message: error.message,
        error_type: this.classifyNetworkError(error),
      },
      rawBody: Buffer.from(error.message),
      url: request.url,
      method: request.method,
    };

    return errorResponse;
  }

  /**
   * Извлечь информацию об ошибке из ответа.
   */
  private extractErrorInfo(
    statusCode: number,
    body: Record<string, unknown>,
  ): { type: ResponseType; message: string } | null {
    // HTTP статус ошибки
    if (statusCode === 429) {
      return { type: ResponseType.RequestsLimit, message: 'Rate limit exceeded' };
    }
    if (statusCode === 404) {
      return { type: ResponseType.NotFound, message: 'Not found' };
    }
    if (statusCode === 401) {
      return { type: ResponseType.LoginRequired, message: 'Unauthorized' };
    }
    if (statusCode >= 500) {
      return { type: ResponseType.InternalError, message: `Internal server error: ${statusCode}` };
    }

    // Ошибки в теле ответа
    const message = (body.message as string) || '';
    const errorType = (body.error_type as string) || '';

    if (body.spam === true) {
      return { type: ResponseType.Spam, message: 'Spam detected' };
    }
    if (message === 'challenge_required') {
      return { type: ResponseType.ChallengeRequired, message: 'Challenge required' };
    }
    if (message === 'login_required') {
      return { type: ResponseType.LoginRequired, message: 'Login required' };
    }
    if (message === 'checkpoint_required') {
      return { type: ResponseType.CheckpointRequired, message: 'Checkpoint required' };
    }
    if (message === 'feedback_required') {
      return { type: ResponseType.FeedbackRequired, message: 'Feedback required' };
    }
    if (errorType === 'sentry_block') {
      return { type: ResponseType.SentryBlock, message: 'Sentry block' };
    }
    if (errorType === 'rate_limit_error') {
      return { type: ResponseType.RateLimitExceeded, message: 'Rate limit error' };
    }
    if (errorType === 'bad_password') {
      return { type: ResponseType.BadPassword, message: 'Bad password' };
    }
    if (errorType === 'invalid_user') {
      return { type: ResponseType.InvalidUser, message: 'Invalid user' };
    }
    if ((body.two_factor_required as boolean) === true) {
      return { type: ResponseType.TwoFactorRequired, message: '2FA required' };
    }

    // Статус ответа
    const status = (body.status as string) || '';
    if (status === 'fail' && message) {
      return { type: ResponseType.Unknown, message };
    }

    return null;
  }

  /**
   * Классифицировать сетевую ошибку.
   */
  private classifyNetworkError(error: Error): ResponseType {
    const message = error.message;

    if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
      return ResponseType.NetworkError;
    }
    if (message.includes('ENOTFOUND')) {
      return ResponseType.NetworkError;
    }
    if (message.includes('ECONNRESET')) {
      return ResponseType.NetworkError;
    }
    if (message.includes('ECONNREFUSED')) {
      return ResponseType.NetworkError;
    }

    return ResponseType.NetworkError;
  }
}
