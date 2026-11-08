import { request, ProxyAgent, type Dispatcher } from 'undici';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import BigJson from 'json-bigint';
import { IHttpClient, HttpRequestOptions, HttpResponse } from './http-client.interface.js';
import { DEFAULT_LOCALE, IG_APP_ID, IG_CAPABILITIES, APP_VERSION, APP_VERSION_CODE } from './constants.js';

const gunzipAsync = promisify(gunzip);

/**
 * BigJson-парсер с настройками для безопасной работы с большими числами.
 *
 * Instagram использует 64-битные ID (например, media_id, user_id),
 * которые превышают безопасный диапазон JavaScript Number.
 *
 * storeAsString: true — сохраняет большие числа как строки
 */
const BigJsonParser = BigJson({ storeAsString: true });

/**
 * Опции для UndiciHttpClient.
 *
 * Позволяют приватному ядру (core) передать свои приватные дефолты
 * (APP_VERSION/locale/IG-заголовки), не меняя поведение по умолчанию.
 */
export interface UndiciHttpClientOptions {
  /** Полная User-Agent строка (по умолчанию — IG Android c ru_RU). */
  userAgent?: string;

  /** Locale для Accept-Language (по умолчанию DEFAULT_LOCALE). */
  locale?: string;

  /** Дополнительные дефолтные заголовки (перекрываются options.headers). */
  defaultHeaders?: Record<string, string>;

  /** Таймаут по умолчанию в мс (по умолчанию 30000). */
  defaultTimeout?: number;
}

/**
 * Реализация IHttpClient на базе undici.
 *
 * undici — официальный HTTP-клиент Node.js (используется в fetch API).
 */
export class UndiciHttpClient implements IHttpClient {
  private proxyAgent: ProxyAgent | null = null;
  private defaultTimeout = 30000;
  private userAgent?: string;
  private locale?: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: UndiciHttpClientOptions = {}) {
    this.userAgent = options.userAgent;
    this.locale = options.locale;
    this.defaultHeaders = options.defaultHeaders ?? {};
    if (options.defaultTimeout !== undefined) {
      this.defaultTimeout = options.defaultTimeout;
    }
  }

  /**
   * Установить прокси-сервер.
   *
   * @param proxyUrl - URL прокси (например, 'http://user:pass@host:port') или null
   */
  setProxy(proxyUrl: string | null): void {
    if (proxyUrl) {
      this.proxyAgent = new ProxyAgent({
        uri: proxyUrl,
      });
    } else {
      this.proxyAgent = null;
    }
  }

  /**
   * Установить таймаут по умолчанию.
   *
   * @param timeout - Таймаут в миллисекундах
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  /**
   * Отправить HTTP-запрос.
   *
   * @param options - Опции запроса
   * @returns Promise с HttpResponse
   */
  async send(options: HttpRequestOptions): Promise<HttpResponse> {
    const url = this.buildUrl(options.url, options.query);
    const timeout = options.timeout ?? this.defaultTimeout;

    const dispatcher = this.proxyAgent ?? undefined;

    // Подготовка тела запроса
    let body: string | Buffer | undefined;
    let contentType: string | undefined;

    if (options.body) {
      if (options.body instanceof URLSearchParams) {
        body = options.body.toString();
        contentType = 'application/x-www-form-urlencoded';
      } else if (options.body instanceof Buffer) {
        body = options.body;
        contentType = 'application/octet-stream';
      } else if (typeof options.body === 'string') {
        body = options.body;
        contentType = 'application/json';
      } else if (options.body instanceof FormData) {
        // FormData обрабатывается автоматически undici
        body = options.body as unknown as string;
      }
    }

    // Подготовка заголовков
    const locale = this.locale ?? DEFAULT_LOCALE;
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent ?? this.getUserAgent(),
      'Accept-Language': `${locale.replace('_', '-')}, en-US; q=0.8`,
      'Accept-Encoding': 'gzip, deflate',
      'X-IG-App-ID': IG_APP_ID,
      'X-IG-Capabilities': IG_CAPABILITIES,
      'X-IG-Connection-Type': 'WIFI',
      'X-IG-Connection-Speed': '-1kbps',
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Добавляем Content-Type если не установлен и есть тело
    if (contentType && !headers['Content-Type']) {
      headers['Content-Type'] = contentType;
    }

    const response = await request(url, {
      method: options.method,
      headers,
      body: body as Dispatcher.RequestOptions['body'],
      dispatcher,
      signal: AbortSignal.timeout(timeout),
      // undici 8: AbortSignal alone can hang on stalled peers
      headersTimeout: timeout,
      bodyTimeout: timeout,
    });

    // Чтение тела ответа
    const rawBody = await response.body.arrayBuffer();
    let rawBodyBuffer = Buffer.from(rawBody);

    // Проверяем Content-Encoding для gzip
    const contentEncoding = response.headers['content-encoding'];
    if (contentEncoding && contentEncoding.includes('gzip')) {
      try {
        rawBodyBuffer = await gunzipAsync(rawBodyBuffer);
      } catch {
        // Если распаковка не удалась, пробуем использовать как есть
      }
    }

    // Парсинг JSON
    let parsedBody: unknown;
    const contentTypeHeader = response.headers['content-type'];

    if (contentTypeHeader && contentTypeHeader.includes('application/json')) {
      try {
        const text = rawBodyBuffer.toString('utf-8');
        parsedBody = BigJsonParser.parse(text);
      } catch {
        // Если парсинг не удался, возвращаем как есть
        parsedBody = rawBodyBuffer.toString('utf-8');
      }
    } else {
      parsedBody = rawBodyBuffer.toString('utf-8');
    }

    // Преобразование заголовков в нормализованный вид
    const normalizedHeaders: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(response.headers)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }

    return {
      statusCode: response.statusCode,
      headers: normalizedHeaders,
      body: parsedBody,
      rawBody: rawBodyBuffer,
      url: url,
      method: options.method,
    };
  }

  /**
   * Построить URL с query-параметрами.
   */
  private buildUrl(
    baseUrl: string,
    query?: Record<string, string | number | boolean>,
  ): string {
    if (!query || Object.keys(query).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.append(key, String(value));
    }

    return url.toString();
  }

  /**
   * Получить User-Agent для Instagram Android приложения.
   */
  private getUserAgent(): string {
    // Instagram 275.0.0.27.98 Android (30/11; 420dpi; 1080x2340; OnePlus; GM1913; OnePlus7; qcom; ru_RU; 458229237)
    return `Instagram ${APP_VERSION} Android (30/11; 420dpi; 1080x2340; OnePlus; GM1913; OnePlus7; qcom; ru_RU; ${APP_VERSION_CODE})`;
  }
}
