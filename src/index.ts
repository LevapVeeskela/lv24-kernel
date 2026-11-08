/**
 * @lv24/kernel — публичное ядро для Instagram-автоматизации.
 *
 * Курируемая публичная поверхность:
 * - Result (IResult/Result/ResponseType/ResultInfo)
 * - Ошибки (минимальный набор)
 * - HTTP (IHttpClient/HttpResponse/HttpRequestOptions, UndiciHttpClient, RequestPipeline)
 * - Сессии (SessionState/AuthTokens/..., guards)
 * - Модели official-ленты (Media/User/insights) и MediaExtractor
 */

// Result
export { Result, type IResult } from './result/result.js';
export { ResponseType } from './result/response-type.js';
export type { ResultInfo } from './result/result-info.js';

// Errors (минимальный набор)
export {
  InstaAgentError,
  AuthError,
  TwoFactorRequiredError,
  ChallengeRequiredError,
  RateLimitedError,
  ActionBlockedError,
  InvalidSessionError,
  NetworkError,
  createInstaError,
} from './errors.js';

// HTTP
export type {
  IHttpClient,
  HttpRequestOptions,
  HttpResponse,
} from './http/http-client.interface.js';
export { UndiciHttpClient, type UndiciHttpClientOptions } from './http/undici-http-client.js';
export { RequestPipeline, type RequestPipelineOptions } from './http/request-pipeline.js';
export {
  type RequestInterceptor,
  type ResponseInterceptor,
  type RequestPipelineContext,
  isRetryError,
  createRetryError,
} from './http/interceptors.js';
export { ErrorInterceptor, type ErrorInterceptorOptions } from './http/error.interceptor.js';
export {
  RateLimitInterceptor,
  type RateLimitInterceptorOptions,
} from './http/rate-limit.interceptor.js';
export { RetryInterceptor, type RetryInterceptorOptions } from './http/retry.interceptor.js';
export {
  DEFAULT_LOCALE,
  IG_APP_ID,
  IG_CAPABILITIES,
  APP_VERSION,
  APP_VERSION_CODE,
} from './http/constants.js';

// Session
export {
  type SessionState,
  type DeviceInfo,
  type SessionCookies,
  type AuthTokens,
  type DeviceUuids,
  type LoggedInUser,
  type ISessionHandler,
  isAuthenticatedSession,
  hasGraphApiToken,
  createMinimalSessionState,
} from './session.js';

// Models (official feed)
export { UserSchema, type User } from './models/user.js';
export {
  MediaSchema,
  type Media,
  ImageVersionSchema,
  type ImageVersion,
  VideoVersionSchema,
  type VideoVersion,
  CandidateSchema,
  type Candidate,
  ImageVersions2Schema,
  type ImageVersions2,
} from './models/media.js';
export {
  AccountInsightSchema,
  type AccountInsight,
  AccountMetricsSchema,
  type AccountMetrics,
  MediaInsightSchema,
  type MediaInsight,
  StoryInsightSchema,
  type StoryInsight,
  ReelsInsightSchema,
  type ReelsInsight,
} from './models/insight.js';

// Extractors
export { MediaExtractor } from './extractors/media-extractor.js';
