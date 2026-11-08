import type { ResponseInterceptor } from './interceptors.js';
import type { HttpRequestOptions, HttpResponse } from './http-client.interface.js';

// isRetryError/createRetryError живут в ./interceptors.js (единая конвенция
// флага `__retry` для pipeline). Реэкспорт — для совместимости пути импорта.
export { isRetryError } from './interceptors.js';
import { createRetryError } from './interceptors.js';

/**
 * Опции для RateLimitInterceptor.
 */
export interface RateLimitInterceptorOptions {
  /** Базовая задержка в миллисекундах (по умолчанию 60000 = 60 секунд) */
  baseDelay?: number;

  /** Максимальная задержка в миллисекундах (по умолчанию 300000 = 5 минут) */
  maxDelay?: number;

  /** Максимальное количество попыток (по умолчанию 5) */
  maxAttempts?: number;

  /** Функция для логирования */
  logger?: (message: string) => void;

  /** Функция sleep (для тестирования) */
  sleepFn?: (ms: number) => Promise<void>;
}

/**
 * Rate Limit Interceptor — автоматическая обработка 429 ошибок.
 *
 * Использует exponential backoff с jitter (рандомизацией):
 * delay = min(baseDelay * 2^attempt + jitter, maxDelay)
 *
 * jitter = gaussian(0, delay * 0.1)
 */
export class RateLimitInterceptor implements ResponseInterceptor {
  private options: Required<Omit<RateLimitInterceptorOptions, 'sleepFn'>> & {
    sleepFn: (ms: number) => Promise<void>;
  };

  /** Счётчик попыток для каждого URL */
  private attemptCounts = new Map<string, number>();

  constructor(options: RateLimitInterceptorOptions = {}) {
    this.options = {
      baseDelay: options.baseDelay ?? 60000,
      maxDelay: options.maxDelay ?? 300000,
      maxAttempts: options.maxAttempts ?? 5,
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

  async onResponse(
    response: HttpResponse,
    request: HttpRequestOptions,
  ): Promise<HttpResponse> {
    if (response.statusCode !== 429) {
      // Не rate limit — сбрасываем счётчик
      this.resetAttempts(request.url);
      return response;
    }

    const url = request.url;
    const currentAttempt = this.getAttempts(url);
    this.attemptCounts.set(url, currentAttempt + 1);

    if (currentAttempt >= this.options.maxAttempts) {
      this.options.logger(
        `[RateLimit] Превышено максимальное количество попыток (${this.options.maxAttempts}) для ${url}`,
      );
      return response;
    }

    // Вычисляем задержку с exponential backoff + jitter
    const delay = this.calculateDelay(currentAttempt);

    this.options.logger(
      `[RateLimit] 429 получена. Попытка ${currentAttempt + 1}/${this.options.maxAttempts}. ` +
      `Задержка ${Math.round(delay / 1000)}с перед повторной попыткой для ${url}`,
    );

    // Ждём
    await this.options.sleepFn(delay);

    // Бросаем специальное исключение для retry (конвенция pipeline)
    throw createRetryError(`Rate limit exceeded. Retry ${currentAttempt + 1}`);
  }

  /**
   * Вычислить задержку с exponential backoff и gaussian jitter.
   *
   * Формула: delay = min(baseDelay * 2^attempt + jitter, maxDelay)
   * jitter = gaussian(0, delay * 0.1)
   */
  private calculateDelay(attempt: number): number {
    const { baseDelay, maxDelay } = this.options;

    // Exponential backoff
    const exponentialDelay = baseDelay * Math.pow(2, attempt);

    // Gaussian jitter (10% от задержки)
    const jitter = this.gaussianRandom(0, exponentialDelay * 0.1);

    const delay = exponentialDelay + jitter;

    // Ограничиваем максимум
    return Math.min(delay, maxDelay);
  }

  /**
   * Генератор gaussian random (Box-Muller transform).
   */
  private gaussianRandom(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    return z0 * std + mean;
  }
}
