/**
 * Перечисление всех известных типов ответов Instagram.
 * Используется в ResultInfo для точной классификации ошибок.
 */
export enum ResponseType {
  /** Успешный ответ */
  OK = 'OK',

  /** Произвольная неизвестная ошибка */
  Unknown = 'Unknown',

  /** Instagram требует повторной авторизации */
  LoginRequired = 'LoginRequired',

  /** Требуется прохождение challenge (SMS/email verification) */
  ChallengeRequired = 'ChallengeRequired',

  /** Checkpoint — Instagram заблокировал аккаунт */
  CheckpointRequired = 'CheckpointRequired',

  /** Превышен лимит запросов (429) */
  RequestsLimit = 'RequestsLimit',

  /** Sentry-блокировка (автоматическая защита Instagram) */
  SentryBlock = 'SentryBlock',

  /** Некорректный запрос (400) */
  BadRequest = 'BadRequest',

  /** Ресурс не найден (404) */
  NotFound = 'NotFound',

  /** Действие заблокировано (spam) */
  ActionBlocked = 'ActionBlocked',

  /** Спам-фильтр сработал */
  Spam = 'Spam',

  /** Неверный пароль */
  BadPassword = 'BadPassword',

  /** Пользователь не существует */
  InvalidUser = 'InvalidUser',

  /** Требуется 2FA-код */
  TwoFactorRequired = 'TwoFactorRequired',

  /** Аккаунт неактивен */
  InactiveUser = 'InactiveUser',

  /** Consent/GDPR требуется */
  ConsentRequired = 'ConsentRequired',

  /** Сетевая ошибка */
  NetworkError = 'NetworkError',

  /** Медиа не найдена */
  MediaNotFound = 'MediaNotFound',

  /** Комментирование отключено */
  CommentingDisabled = 'CommentingDisabled',

  /** Лимит rate limit (Graph API, 429) */
  RateLimitExceeded = 'RateLimitExceeded',

  /** Внутренняя ошибка */
  InternalError = 'InternalError',

  /** Ошибка загрузки (upload) */
  UploadError = 'UploadError',

  /** Аккаунт заблокирован */
  AccountBanned = 'AccountBanned',

  /** Feedback required (временная блокировка действий) */
  FeedbackRequired = 'FeedbackRequired',

  /** Некорректные входные данные (валидация) */
  InvalidInput = 'InvalidInput',

  /** GraphQL ошибка (ошибка запроса или ответа) */
  GraphQLError = 'GraphQLError',

  /** Метод или API ещё не реализован (заглушка, fail вместо throw) */
  NotImplemented = 'NotImplemented',
}
