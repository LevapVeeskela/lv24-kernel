# Changelog

All notable changes to `@lv24/kernel` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-11-08

### Added

- `Result` / `IResult` / `ResponseType` / `ResultInfo` result model.
- Typed errors: `InstaAgentError`, `AuthError`, `TwoFactorRequiredError`,
  `ChallengeRequiredError`, `RateLimitedError`, `ActionBlockedError`,
  `InvalidSessionError`, `NetworkError`, `createInstaError`.
- `UndiciHttpClient` and `RequestPipeline` with request/response interceptors,
  retries and rate-limit handling.
- `ErrorInterceptor`, `RateLimitInterceptor`, `RetryInterceptor`.
- Session types and guards (`SessionState`, `SessionCookies`, `AuthTokens`,
  `isAuthenticatedSession`, `hasGraphApiToken`, `createMinimalSessionState`).
- Official Instagram feed models and Zod schemas (user, media, insights).
- `MediaExtractor`.
- Public constants (`DEFAULT_LOCALE`, `IG_APP_ID`, `IG_CAPABILITIES`,
  `APP_VERSION`, `APP_VERSION_CODE`).

### Notes

- First public release, extracted from the private LV24 InstaAgent monorepo.
- ESM only, Node.js >= 20, MIT.
