import { ResponseType } from './response-type.js';

/**
 * Метаданные об ошибке или успехе операции.
 * Содержит тип ответа Instagram, сообщение, и опциональные данные challenge.
 */
export interface ResultInfo {
  /** Классификация ответа Instagram */
  readonly responseType: ResponseType;

  /** Человекочитаемое сообщение об ошибке */
  readonly message: string;

  /** Исходное исключение (если было) */
  readonly exception?: Error;

  /** Нужен ли challenge (SMS/email verification) */
  readonly needsChallenge: boolean;

  /** Дата окончания action block (если есть) */
  readonly actionBlockEnd?: Date;

  /** Данные challenge (endpoint для верификации) */
  readonly challengeInfo?: {
    readonly url: string;
    readonly apiPath: string;
  };

  /** Данные 2FA (для двухфакторной аутентификации) */
  readonly twoFactorInfo?: {
    readonly obfuscated_identifier: string;
    readonly sms_two_factor_enabled?: boolean;
    readonly totp_two_factor_enabled?: boolean;
    readonly backup_codes?: string[];
  };

  /** Дополнительная информация об ошибке (raw response) */
  readonly rawResponse?: unknown;

  /** HTTP статус код (если применимо) */
  readonly httpStatusCode?: number;
}
