import { IHttpClient, HttpRequestOptions, HttpResponse } from './http-client.interface.js';
import { RequestInterceptor, ResponseInterceptor, RequestPipelineContext, isRetryError } from './interceptors.js';
import { Result, type IResult } from '../result/result.js';

/**
 * Опции для RequestPipeline.
 */
export interface RequestPipelineOptions {
  /** HTTP клиент */
  httpClient: IHttpClient;

  /** Request interceptors (применяются по порядку) */
  requestInterceptors?: RequestInterceptor[];

  /** Response interceptors (применяются по порядку) */
  responseInterceptors?: ResponseInterceptor[];

  /** Максимальное количество retry попыток (по умолчанию 3) */
  maxRetries?: number;

  /** Базовый URL для относительных путей */
  baseUrl?: string;

  /** Функция для логирования */
  logger?: (message: string) => void;
}

/**
 * Request Pipeline — управляет выполнением HTTP-запросов с interceptors.
 *
 * Последовательность выполнения:
 * 1. Применяются request interceptors (по порядку)
 * 2. Выполняется HTTP-запрос через IHttpClient
 * 3. Применяются response interceptors (по порядку)
 * 4. При ошибке — onError interceptors
 * 5. При retry-ошибке — повторная попытка
 *
 * Возвращает IResult<T> вместо выбрасывания исключений.
 */
export class RequestPipeline {
  private httpClient: IHttpClient;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];
  private maxRetries: number;
  private baseUrl?: string;
  private logger: (message: string) => void;

  constructor(options: RequestPipelineOptions) {
    this.httpClient = options.httpClient;
    this.requestInterceptors = options.requestInterceptors ?? [];
    this.responseInterceptors = options.responseInterceptors ?? [];
    this.maxRetries = options.maxRetries ?? 3;
    this.baseUrl = options.baseUrl;
    this.logger = options.logger ?? (() => {});
  }

  /**
   * Добавить request interceptor.
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Добавить response interceptor.
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Установить базовый URL.
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Выполнить HTTP-запрос с interceptors и retry logic.
   *
   * @param options - Опции запроса
   * @returns Promise с IResult<HttpResponse>
   */
  async execute(options: HttpRequestOptions): Promise<IResult<HttpResponse>> {
    // Разрешаем URL относительно baseUrl
    const url = this.resolveUrl(options.url);
    const fullOptions: HttpRequestOptions = {
      ...options,
      url,
    };

    // Создаём контекст выполнения
    const context: RequestPipelineContext = {
      request: fullOptions,
      attempt: 0,
      metadata: {},
    };

    try {
      // Применяем request interceptors
      context.request = await this.applyRequestInterceptors(context.request);

      // Выполняем запрос с retry logic
      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        context.attempt = attempt;

        try {
          this.logger(`[Pipeline] Request: ${context.request.method} ${context.request.url} (attempt ${attempt + 1})`);

          // Выполняем HTTP-запрос
          let response = await this.httpClient.send(context.request);

          // Применяем response interceptors
          response = await this.applyResponseInterceptors(response, context.request);

          // Успех
          return Result.success(response);
        } catch (error) {
          lastError = error as Error;

          // Проверяем, нужно ли retry
          if (!this.shouldRetry(error as Error, attempt)) {
            break;
          }

          this.logger(`[Pipeline] Retry scheduled (attempt ${attempt + 1}/${this.maxRetries})`);
        }
      }

      // Все попытки исчерпаны или retry не требуется
      // Создаём HttpResponse из ошибки
      const errorResponse = await this.createErrorResponse(lastError!, context.request);
      return Result.fail(
        lastError!.message,
        undefined,
        errorResponse as unknown as HttpResponse,
        lastError,
      );
    } catch (error) {
      // Неожиданная ошибка
      return Result.fail(
        (error as Error).message,
        undefined,
        undefined as unknown as HttpResponse,
        error as Error,
      );
    }
  }

  /**
   * Применить request interceptors по порядку.
   */
  private async applyRequestInterceptors(
    options: HttpRequestOptions,
  ): Promise<HttpRequestOptions> {
    let currentOptions = options;

    for (const interceptor of this.requestInterceptors) {
      currentOptions = await interceptor.onRequest(currentOptions);
    }

    return currentOptions;
  }

  /**
   * Применить response interceptors по порядку.
   */
  private async applyResponseInterceptors(
    response: HttpResponse,
    request: HttpRequestOptions,
  ): Promise<HttpResponse> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor.onResponse(currentResponse, request);
    }

    return currentResponse;
  }

  /**
   * Проверить, нужно ли выполнять retry.
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Достигнут лимит попыток
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Проверяем, является ли ошибка retry-аемой
    return isRetryError(error);
  }

  /**
   * Создать HttpResponse из ошибки.
   */
  private async createErrorResponse(
    error: Error,
    request: HttpRequestOptions,
  ): Promise<HttpResponse> {
    // Пытаемся обработать через response interceptors
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onError) {
        try {
          const response = await interceptor.onError(error, request);
          if (response) {
            return response;
          }
        } catch {
          // Игнорируем ошибки в interceptors
        }
      }
    }

    // Возвращаем стандартный error response
    return {
      statusCode: 0,
      headers: {},
      body: { message: error.message },
      rawBody: Buffer.from(error.message),
      url: request.url,
      method: request.method,
    };
  }

  /**
   * Разрешить URL относительно baseUrl.
   */
  private resolveUrl(url: string): string {
    if (!this.baseUrl || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Удаляем trailing slash из baseUrl
    const base = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    // Добавляем leading slash к url если нужно
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${base}${path}`;
  }

  /**
   * Выполнить HTTP-запрос (алиас для execute).
   *
   * @param options - Опции запроса
   * @returns Promise с IResult<HttpResponse>
   */
  async send(options: HttpRequestOptions): Promise<IResult<HttpResponse>> {
    return this.execute(options);
  }
}
