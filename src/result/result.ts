import { ResultInfo } from './result-info.js';
import { ResponseType } from './response-type.js';

export { ResponseType } from './response-type.js';

/**
 * Результат операции Instagram API.
 *
 * Вместо throw/catch используем этот паттерн для type-safe обработки ошибок.
 *
 * Пример использования:
 * ```typescript
 * const result = await processor.getMedia(mediaId);
 * if (result.succeeded) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.info.message);
 * }
 * ```
 */
export interface IResult<T> {
  /** true если операция выполнена успешно */
  readonly succeeded: boolean;

  /** Результат выполнения (может быть undefined при ошибке) */
  readonly value: T;

  /** Метаданные об успехе или ошибке */
  readonly info: ResultInfo;
}

/**
 * Фабричный класс для создания результатов операций.
 *
 * Предоставляет статические методы для создания успешных и ошибочных результатов,
 * а также автоматический маппинг HTTP-ответов Instagram в типизированные результаты.
 */
export class Result {
  /**
   * Создаёт успешный результат.
   *
   * @param value - Результат операции
   * @param message - Опциональное сообщение (по умолчанию пусто)
   * @returns IResult<T> с succeeded = true
   */
  static success<T>(value: T, message = ''): IResult<T> {
    return {
      succeeded: true,
      value,
      info: {
        responseType: ResponseType.OK,
        message,
        needsChallenge: false,
      },
    };
  }

  /**
   * Создаёт ошибочный результат.
   *
   * @param message - Сообщение об ошибке
   * @param responseType - Тип ответа (по умолчанию Unknown)
   * @param value - Опциональное значение (может быть полезно для частичных результатов)
   * @param exception - Исходное исключение (если было)
   * @param additionalInfo - Дополнительные данные (например, twoFactorInfo)
   * @returns IResult<T> с succeeded = false
   */
  static fail<T>(
    message: string,
    responseType: ResponseType = ResponseType.Unknown,
    value?: T,
    exception?: Error,
    additionalInfo?: Partial<ResultInfo>,
  ): IResult<T> {
    return {
      succeeded: false,
      value: value as T,
      info: {
        responseType,
        message,
        exception,
        needsChallenge: responseType === ResponseType.ChallengeRequired,
        ...additionalInfo,
      },
    };
  }

  /**
   * Создаёт Result из HTTP-ответа Instagram.
   * Автоматически определяет ResponseType из тела ответа и статуса.
   *
   * @param statusCode - HTTP статус код
   * @param body - Тело ответа (распарсенный JSON)
   * @param value - Опциональное значение результата
   * @returns IResult<T> с определённым ResponseType
   */
  static fromResponse<T>(
    statusCode: number,
    body: Record<string, unknown>,
    value?: T,
  ): IResult<T> {
    // Маппинг HTTP статусов
    if (statusCode === 429) {
      return Result.fail(
        'Rate limit exceeded',
        ResponseType.RequestsLimit,
        value,
      );
    }
    if (statusCode === 404) {
      return Result.fail('Not found', ResponseType.NotFound, value);
    }
    if (statusCode === 401) {
      return Result.fail('Unauthorized', ResponseType.LoginRequired, value);
    }
    if (statusCode === 400) {
      // Обработка 400 ошибок с детализацией из тела ответа
    } else if (statusCode >= 500) {
      return Result.fail(
        `Internal server error: ${statusCode}`,
        ResponseType.InternalError,
        value,
      );
    }

    // Извлечение данных из тела ответа
    const message = (body.message as string) || '';
    const errorType = (body.error_type as string) || '';
    const status = (body.status as string) || '';

    // Приоритетный маппинг ошибок (по порядку проверки)
    if (body.spam === true) {
      return Result.fail('Spam detected', ResponseType.Spam, value);
    }
    if (message === 'challenge_required') {
      return Result.fail(
        'Challenge required',
        ResponseType.ChallengeRequired,
        value,
      );
    }
    if (message === 'login_required') {
      return Result.fail(
        'Login required',
        ResponseType.LoginRequired,
        value,
      );
    }
    if (message === 'checkpoint_required') {
      return Result.fail(
        'Checkpoint required',
        ResponseType.CheckpointRequired,
        value,
      );
    }
    if (message === 'feedback_required') {
      return Result.fail(
        'Feedback required',
        ResponseType.FeedbackRequired,
        value,
      );
    }
    if (errorType === 'sentry_block') {
      return Result.fail('Sentry block', ResponseType.SentryBlock, value);
    }
    if (errorType === 'rate_limit_error') {
      return Result.fail('Rate limit', ResponseType.RateLimitExceeded, value);
    }
    if (errorType === 'bad_password') {
      return Result.fail('Bad password', ResponseType.BadPassword, value);
    }
    if (errorType === 'invalid_user') {
      return Result.fail('Invalid user', ResponseType.InvalidUser, value);
    }
    if ((body.two_factor_required as boolean) === true) {
      return Result.fail('2FA required', ResponseType.TwoFactorRequired, value);
    }
    if ((body.inactive_user as boolean) === true) {
      return Result.fail('Inactive user', ResponseType.InactiveUser, value);
    }

    // Проверка на успех
    if (status === 'ok') {
      return Result.success(value as T);
    }

    // Ошибка по умолчанию
    return Result.fail(message || 'Unknown error', ResponseType.Unknown, value);
  }

  /**
   * Создаёт Result из исключения (сетевая ошибка, таймаут и т.п.)
   *
   * @param error - Исключение
   * @param value - Опциональное значение
   * @returns IResult<T> с responseType = NetworkError
   */
  static fromError<T>(error: Error, value?: T): IResult<T> {
    const message = error.message || 'Unknown error';

    // Определение типа ошибки по сообщению
    let responseType = ResponseType.NetworkError;

    if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
      responseType = ResponseType.NetworkError;
    } else if (message.includes('ENOTFOUND')) {
      responseType = ResponseType.NetworkError;
    } else if (message.includes('ECONNRESET')) {
      responseType = ResponseType.NetworkError;
    } else if (message.includes('ECONNREFUSED')) {
      responseType = ResponseType.NetworkError;
    }

    return Result.fail(message, responseType, value, error);
  }
}
