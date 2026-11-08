import type { ResponseInterceptor } from './interceptors.js';
import type { HttpRequestOptions, HttpResponse } from './http-client.interface.js';
import { isRetryError, createRetryError } from './interceptors.js';

/**
 * Опции для RetryInterceptor.
 */
export interface RetryInterceptorOptions {
  /** Максимальное количество попыток (по умолчанию 3) */
  maxAttempts?: number;

  /** Фактор exponential backoff (по умолчанию 2) */
  factor?: number;

  /** Минимальная задержка в миллисекундах (по умолчанию 1000 = 1 секунда) */
  minDelay?: number;

  /** Максимальная задержка в миллисекундах (по умолчанию 10000 = 10 секунд) */
  maxDelay?: number;

  /** Функция для логирования */
  logger?: (message: string) => void;

  /** Функция sleep (для тестирования) */
  sleepFn?: (ms: number) => Promise<void>;
}

/**
 * Сетевые ошибки, которые следует retry-ить.
 */
const RETRYABLE_NETWORK_ERRORS = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'UND_ERR_SOCKET',
  'UND_ERR_REQUEST_TIMEOUT',
];

/**
 * HTTP статус коды, которые следует retry-ить.
 */
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

/**
 * Retry Interceptor — автоматические повторные попытки при ошибках.
 *
 * Retry при:
 * - Сетевых ошибках (ETIMEDOUT, ECONNRESET, ENOTFOUND, etc.)
 * - Серверных ошибках Instagram (500, 502, 503, 504)
 *
 * Использует exponential backoff:
 * delay = min(minDelay * factor^attempt, maxDelay)
 */
export class RetryInterceptor implements ResponseInterceptor {
  private options: Required<Omit<RetryInterceptorOptions, 'sleepFn'>> & {
    sleepFn: (ms: number) => Promise<void>;
  };

  /** Счётчик попыток для каждого URL */
  private attemptCounts = new Map<string, number>();

  constructor(options: RetryInterceptorOptions = {}) {
    this.options = {
      maxAttempts: options.maxAttempts ?? 3,
      factor: options.factor ?? 2,
      minDelay: options.minDelay ?? 1000,
      maxDelay: options.maxDelay ?? 10000,
      logger: options.logger ?? (() => {}),
      sleepFn: options.sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    };
  }

  /**
   * Сбросить счётчик попыток для URL.
   */
  resetAttempts(url: string): void {
    this.attemptCounts.delete(url);
  }

  /**
   * Получить количество попыток для URL.
   */
  getAttempts(url: string): number {
    return this.attemptCounts.get(url) || 0;
  }

  onResponse(
    response: HttpResponse,
    request: HttpRequestOptions,
  ): HttpResponse {
    if (!RETRYABLE_STATUS_CODES.includes(response.statusCode)) {
      // Не retry-аемый статус — сбрасываем счётчик
      this.resetAttempts(request.url);
      return response;
    }

    const url = request.url;
    const currentAttempt = this.getAttempts(url);
    this.attemptCounts.set(url, currentAttempt + 1);

    if (currentAttempt >= this.options.maxAttempts) {
      this.options.logger(
        `[Retry] Превышено максимальное количество попыток (${this.options.maxAttempts}) для ${url}`,
      );
      return response;
    }

    const delay = this.calculateDelay(currentAttempt);

    this.options.logger(
      `[Retry] HTTP ${response.statusCode}. Попытка ${currentAttempt + 1}/${this.options.maxAttempts}. ` +
      `Задержка ${Math.round(delay / 1000)}с перед повторной попыткой для ${url}`,
    );

    // Бросаем ошибку для retry (конвенция pipeline)
    throw createRetryError(`HTTP ${response.statusCode}. Retry ${currentAttempt + 1}`);
  }

  onError(
    error: Error,
    request: HttpRequestOptions,
  ): HttpResponse | Promise<HttpResponse> {
    // Проверяем, является ли ошибка retry-аемой
    if (!this.isRetryableError(error)) {
      this.resetAttempts(request.url);
      throw error;
    }

    // Rate limit retry уже обработан в RateLimitInterceptor
    if (isRetryError(error)) {
      throw error;
    }

    const url = request.url;
    const currentAttempt = this.getAttempts(url);
    this.attemptCounts.set(url, currentAttempt + 1);

    if (currentAttempt >= this.options.maxAttempts) {
      this.options.logger(
        `[Retry] Превышено максимальное количество попыток (${this.options.maxAttempts}) для ${url}: ${error.message}`,
      );
      throw error;
    }

    const delay = this.calculateDelay(currentAttempt);

    this.options.logger(
      `[Retry] Network error: ${error.message}. Попытка ${currentAttempt + 1}/${this.options.maxAttempts}. ` +
      `Задержка ${Math.round(delay / 1000)}с перед повторной попыткой для ${url}`,
    );

    // Бросаем ошибку для retry (конвенция pipeline)
    throw createRetryError(`Network error: ${error.message}. Retry ${currentAttempt + 1}`);
  }

  /**
   * Проверить, является ли ошибка retry-аемой.
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message;

    return RETRYABLE_NETWORK_ERRORS.some((code) => message.includes(code));
  }

  /**
   * Вычислить задержку с exponential backoff.
   *
   * Формула: delay = min(minDelay * factor^attempt, maxDelay)
   */
  private calculateDelay(attempt: number): number {
    const { minDelay, maxDelay, factor } = this.options;

    const exponentialDelay = minDelay * Math.pow(factor, attempt);

    return Math.min(exponentialDelay, maxDelay);
  }
}
