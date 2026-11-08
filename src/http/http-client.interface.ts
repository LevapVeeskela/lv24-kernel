/**
 * Опции HTTP-запроса.
 */
export interface HttpRequestOptions {
  /** URL запроса (полный или относительный) */
  url: string;

  /** HTTP метод */
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

  /** Заголовки запроса */
  headers?: Record<string, string>;

  /** Тело запроса (string, Buffer, URLSearchParams, FormData) */
  body?: string | Buffer | URLSearchParams | FormData;

  /** Query-параметры (будут добавлены к URL) */
  query?: Record<string, string | number | boolean>;

  /** Таймаут в миллисекундах (по умолчанию 30000) */
  timeout?: number;

  /** Нужно ли автоматически следовать редиректам (по умолчанию true) */
  followRedirects?: boolean;

  /** Максимальное количество редиректов (по умолчанию 5) */
  maxRedirects?: number;
}

/**
 * HTTP-ответ.
 */
export interface HttpResponse {
  /** HTTP статус код */
  statusCode: number;

  /** Заголовки ответа (ключи в нижнем регистре) */
  headers: Record<string, string | string[] | undefined>;

  /** Распарсенное тело (JSON или string) */
  body: unknown;

  /** Исходное тело как Buffer */
  rawBody: Buffer;

  /** URL запроса (после редиректов) */
  url?: string;

  /** Метод запроса */
  method?: string;
}

/**
 * Абстракция HTTP-транспорта.
 *
 * Позволяет подменить реальный транспорт на мок для тестов.
 *
 * @example
 * ```typescript
 * // Использование в тестах с моком
 * const mockClient: IHttpClient = {
 *   send: vi.fn().mockResolvedValue({ statusCode: 200, body: { status: 'ok' } }),
 *   setProxy: vi.fn(),
 * };
 * ```
 */
export interface IHttpClient {
  /**
   * Отправить HTTP-запрос.
   *
   * @param options - Опции запроса
   * @returns Promise с HttpResponse
   */
  send(options: HttpRequestOptions): Promise<HttpResponse>;

  /**
   * Установить прокси-сервер.
   *
   * @param proxyUrl - URL прокси (например, 'http://user:pass@host:port') или null для отключения
   */
  setProxy(proxyUrl: string | null): void;
}
