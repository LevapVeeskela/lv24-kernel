/**
 * Полное состояние сессии Instagram.
 *
 * Включает все данные, необходимые для восстановления сессии:
 * - Device info (детерминистически сгенерированное)
 * - Cookies (sessionid, csrftoken, etc.)
 * - Tokens (bearer, etc.)
 * - UUIDs (для идентификации устройства)
 */
export interface SessionState {
  /** Идентификатор сессии (username или custom ID) */
  sessionId: string;

  /** Информация об устройстве */
  device: DeviceInfo;

  /** Cookies */
  cookies: SessionCookies;

  /** Токены авторизации */
  tokens: AuthTokens;

  /** UUIDs устройства */
  uuids: DeviceUuids;

  /** Данные пользователя (после логина) */
  user?: LoggedInUser;

  /**
   * How this session was established.
   * `mobile` = password / FileSessionHandler private-API login.
   * `browser` = cookie-only import (no mobile device session).
   */
  sessionMode?: 'mobile' | 'browser';

  /** Время создания сессии */
  createdAt: Date;

  /** Время последнего использования */
  lastUsedAt: Date;

  /** Время истечения сессии (если известно) */
  expiresAt?: Date;
}

/**
 * Информация об устройстве (Android device fingerprint).
 */
export interface DeviceInfo {
  /** Android ID */
  androidId: string;

  /** Manufacturer (например, "OnePlus") */
  manufacturer: string;

  /** Model (например, "GM1913") */
  model: string;

  /** Android version (например, "11") */
  androidVersion: string;

  /** Android SDK version (например, "30") */
  androidSdk: number;

  /** DPI экрана (например, "420dpi") */
  dpi: string;

  /** Разрешение экрана (например, "1080x2340") */
  resolution: string;

  /** chipset (например, "qcom") */
  chipset: string;

  /** Версия приложения Instagram (например, "275.0.0.27.98") */
  appVersion: string;

  /** Версия приложения (numeric, например, "458229237") */
  appVersionCode: string;

  /** Язык (например, "ru_RU") */
  locale: string;
}

/**
 * Cookies Instagram сессии.
 */
export interface SessionCookies {
  /** Session ID (основной cookie авторизации) */
  sessionid?: string;

  /** CSRF токен */
  csrftoken?: string;

  /** ds_user_id */
  ds_user_id?: string;

  /** mid */
  mid?: string;

  /** ig_did */
  ig_did?: string;

  /** rur (признак авторизованной сессии) */
  rur?: string;

  /** Другие cookies */
  [key: string]: string | undefined;
}

/**
 * Токены авторизации.
 */
export interface AuthTokens {
  /** Bearer токен (IG:2:{base64} формат) */
  bearerToken?: string;

  /** Graph API access token (для бизнес-аккаунтов) */
  graphApiToken?: string;

  /** Token expiry timestamp */
  tokenExpiry?: Date;

  /** Password encryption public key (из /qe/sync/) */
  passwordEncryptionPubKey?: string;

  /** Password encryption key ID (из /qe/sync/) */
  passwordEncryptionKeyId?: number;

  /** WWW Claim для подписи запросов */
  wwwClaim?: string;

  /** CSRF token */
  csrfToken?: string;
}

/**
 * UUIDs устройства для идентификации.
 */
export interface DeviceUuids {
  /** Google Advertising ID */
  googleAdId: string;

  /** Client Session ID */
  clientSessionId: string;

  /** Phone ID */
  phoneId: string;

  /** Device ID */
  deviceId: string;

  /** Request ID */
  requestId?: string;
}

/**
 * Данные авторизованного пользователя.
 */
export interface LoggedInUser {
  /** User ID */
  pk: string;

  /** Username */
  username: string;

  /** Full name */
  fullName: string;

  /** Profile picture URL */
  profilePicUrl?: string;

  /** Is verified */
  isVerified: boolean;

  /** Is private */
  isPrivate: boolean;

  /** Email (если доступен) */
  email?: string;

  /** Phone number (если доступен) */
  phoneNumber?: string;
}

/**
 * Интерфейс для обработки сессий.
 */
export interface ISessionHandler {
  /**
   * Сохранить сессию.
   */
  saveSession(session: SessionState): Promise<boolean>;

  /**
   * Загрузить сессию по идентификатору.
   */
  loadSession(sessionId: string): Promise<SessionState | null>;

  /**
   * Удалить сессию.
   */
  deleteSession(sessionId: string): Promise<boolean>;

  /**
   * Проверить существует ли сессия.
   */
  sessionExists(sessionId: string): Promise<boolean>;

  /**
   * Получить все идентификаторы сессий.
   */
  getAllSessionIds(): Promise<string[]>;
}

/**
 * Type guard: сессия содержит авторизационные cookies (mobile/private API).
 */
export function isAuthenticatedSession(
  state: SessionState | null | undefined,
): state is SessionState {
  return !!state?.cookies?.sessionid;
}

/**
 * Type guard: сессия содержит Graph API access token (official API).
 */
export function hasGraphApiToken(
  state: SessionState | null | undefined,
): state is SessionState {
  return !!state?.tokens?.graphApiToken;
}

/**
 * Создать минимальное состояние сессии.
 *
 * Удобно для official (Graph API) сценариев, где device/uuids не нужны:
 * достаточно sessionId и опционального graphApiToken.
 */
export function createMinimalSessionState(
  sessionId: string,
  graphApiToken?: string,
): SessionState {
  const now = new Date();
  return {
    sessionId,
    device: {
      androidId: '',
      manufacturer: '',
      model: '',
      androidVersion: '',
      androidSdk: 0,
      dpi: '',
      resolution: '',
      chipset: '',
      appVersion: '',
      appVersionCode: '',
      locale: 'en_US',
    },
    cookies: {},
    tokens: graphApiToken ? { graphApiToken } : {},
    uuids: {
      googleAdId: '',
      clientSessionId: '',
      phoneId: '',
      deviceId: '',
    },
    sessionMode: 'browser',
    createdAt: now,
    lastUsedAt: now,
  };
}
