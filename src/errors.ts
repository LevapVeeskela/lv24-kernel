/**
 * Минимальный набор ошибок для публичного ядра.
 * Копия классификации из приватного ядра (без привязки к private API).
 */

import { ResponseType } from './result/response-type.js';

/**
 * Базовый класс для всех ошибок Instagram.
 */
export class InstaAgentError extends Error {
  readonly responseType: ResponseType;
  readonly statusCode?: number;
  readonly responseBody?: unknown;

  constructor(
    message: string,
    responseType: ResponseType = ResponseType.Unknown,
    statusCode?: number,
    responseBody?: unknown,
  ) {
    super(message);
    this.name = 'InstaAgentError';
    this.responseType = responseType;
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Ошибка авторизации.
 */
export class AuthError extends InstaAgentError {
  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message, ResponseType.LoginRequired, statusCode, responseBody);
    this.name = 'AuthError';
  }
}

/**
 * Требуется 2FA.
 */
export class TwoFactorRequiredError extends InstaAgentError {
  readonly twoFactorIdentifier?: string;
  readonly methods?: ('sms' | 'totp' | 'backup')[];

  constructor(
    message: string,
    twoFactorIdentifier?: string,
    methods?: ('sms' | 'totp' | 'backup')[],
  ) {
    super(message, ResponseType.TwoFactorRequired);
    this.name = 'TwoFactorRequiredError';
    this.twoFactorIdentifier = twoFactorIdentifier;
    this.methods = methods;
  }
}

/**
 * Требуется Challenge verification.
 */
export class ChallengeRequiredError extends InstaAgentError {
  readonly challengeUrl?: string;

  constructor(message: string, challengeUrl?: string) {
    super(message, ResponseType.ChallengeRequired);
    this.name = 'ChallengeRequiredError';
    this.challengeUrl = challengeUrl;
  }
}

/**
 * Превышен лимит запросов (Rate Limited).
 */
export class RateLimitedError extends InstaAgentError {
  readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, ResponseType.RequestsLimit, 429);
    this.name = 'RateLimitedError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Действие заблокировано (Action Blocked).
 */
export class ActionBlockedError extends InstaAgentError {
  readonly blockEnd?: Date;

  constructor(message: string, blockEnd?: Date) {
    super(message, ResponseType.ActionBlocked);
    this.name = 'ActionBlockedError';
    this.blockEnd = blockEnd;
  }
}

/**
 * Сессия недействительна.
 */
export class InvalidSessionError extends InstaAgentError {
  constructor(message: string = 'Invalid session') {
    super(message, ResponseType.LoginRequired);
    this.name = 'InvalidSessionError';
  }
}

/**
 * Сетевая ошибка.
 */
export class NetworkError extends InstaAgentError {
  constructor(message: string, statusCode?: number) {
    super(message, ResponseType.NetworkError, statusCode);
    this.name = 'NetworkError';
  }
}

/**
 * Фабрика для создания ошибок из ответа Instagram.
 */
export function createInstaError(
  messageType: string,
  statusCode?: number,
  responseBody?: unknown,
): InstaAgentError {
  // Нормализуем сообщение: заменяем подчёркивания на пробелы и приводим к нижнему регистру
  const normalizedMessage = messageType.toLowerCase().replace(/_/g, ' ');

  if (normalizedMessage.includes('challenge required')) {
    return new ChallengeRequiredError(messageType);
  }
  if (normalizedMessage.includes('two factor') || normalizedMessage.includes('2fa')) {
    return new TwoFactorRequiredError(messageType);
  }
  if (normalizedMessage.includes('rate limit')) {
    return new RateLimitedError(messageType);
  }
  if (normalizedMessage.includes('action blocked') || normalizedMessage.includes('try again later')) {
    return new ActionBlockedError(messageType);
  }
  if (normalizedMessage.includes('session') || normalizedMessage.includes('login')) {
    return new InvalidSessionError(messageType);
  }

  // По умолчанию
  return new InstaAgentError(messageType, ResponseType.Unknown, statusCode, responseBody);
}
