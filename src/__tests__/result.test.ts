import { describe, it, expect } from 'vitest';
import { Result, type IResult } from '../result/result.js';
import { ResponseType } from '../result/response-type.js';

describe('Result', () => {
  describe('success', () => {
    it('returns succeeded: true with the given value', () => {
      const value = { id: 1, username: 'test' };
      const result = Result.success(value);

      expect(result.succeeded).toBe(true);
      expect(result.value).toBe(value);
      expect(result.info.responseType).toBe(ResponseType.OK);
      expect(result.info.message).toBe('');
      expect(result.info.needsChallenge).toBe(false);
    });

    it('returns succeeded: true with a custom message', () => {
      const value = { id: 1 };
      const message = 'Operation completed';
      const result = Result.success(value, message);

      expect(result.succeeded).toBe(true);
      expect(result.value).toBe(value);
      expect(result.info.message).toBe(message);
    });
  });

  describe('fail', () => {
    it('returns succeeded: false with the given responseType', () => {
      const message = 'Error occurred';
      const responseType = ResponseType.BadRequest;
      const result = Result.fail<string>(message, responseType);

      expect(result.succeeded).toBe(false);
      expect(result.info.message).toBe(message);
      expect(result.info.responseType).toBe(responseType);
      expect(result.info.needsChallenge).toBe(false);
    });

    it('defaults to responseType = Unknown', () => {
      const result = Result.fail<string>('Error');

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.Unknown);
    });

    it('sets needsChallenge: true for ChallengeRequired', () => {
      const result = Result.fail<string>(
        'Challenge required',
        ResponseType.ChallengeRequired,
      );

      expect(result.info.needsChallenge).toBe(true);
    });

    it('keeps the passed exception', () => {
      const error = new Error('Original error');
      const result = Result.fail<string>('Error', ResponseType.Unknown, undefined, error);

      expect(result.info.exception).toBe(error);
    });

    it('keeps the optional value', () => {
      const partialValue = { id: 1 };
      const result = Result.fail('Error', ResponseType.Unknown, partialValue);

      expect(result.value).toBe(partialValue);
    });
  });

  describe('fromResponse', () => {
    it('maps HTTP 429 to RequestsLimit', () => {
      const result = Result.fromResponse(429, {});

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.RequestsLimit);
      expect(result.info.message).toBe('Rate limit exceeded');
    });

    it('maps HTTP 404 to NotFound', () => {
      const result = Result.fromResponse(404, {});

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.NotFound);
      expect(result.info.message).toBe('Not found');
    });

    it('maps HTTP 401 to LoginRequired', () => {
      const result = Result.fromResponse(401, {});

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.LoginRequired);
      expect(result.info.message).toBe('Unauthorized');
    });

    it('maps HTTP 500+ to InternalError', () => {
      const result = Result.fromResponse(503, {});

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.InternalError);
    });

    it('maps spam: true to Spam', () => {
      const result = Result.fromResponse(200, { spam: true });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.Spam);
    });

    it('maps message: challenge_required to ChallengeRequired', () => {
      const result = Result.fromResponse(400, { message: 'challenge_required' });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.ChallengeRequired);
      expect(result.info.needsChallenge).toBe(true);
    });

    it('maps message: login_required to LoginRequired', () => {
      const result = Result.fromResponse(400, { message: 'login_required' });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.LoginRequired);
    });

    it('maps error_type: bad_password to BadPassword', () => {
      const result = Result.fromResponse(400, {
        error_type: 'bad_password',
      });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.BadPassword);
    });

    it('maps two_factor_required: true to TwoFactorRequired', () => {
      const result = Result.fromResponse(400, { two_factor_required: true });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.TwoFactorRequired);
    });

    it('maps status: ok to success', () => {
      const value = { id: 1, username: 'test' };
      const result = Result.fromResponse(200, { status: 'ok' }, value);

      expect(result.succeeded).toBe(true);
      expect(result.value).toBe(value);
      expect(result.info.responseType).toBe(ResponseType.OK);
    });

    it('returns Unknown for an unknown error', () => {
      const result = Result.fromResponse(400, { message: 'unknown_error' });

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.Unknown);
      expect(result.info.message).toBe('unknown_error');
    });
  });

  describe('fromError', () => {
    it('creates a Result from Error with responseType NetworkError', () => {
      const error = new Error('Network timeout');
      const result = Result.fromError<string>(error);

      expect(result.succeeded).toBe(false);
      expect(result.info.responseType).toBe(ResponseType.NetworkError);
      expect(result.info.exception).toBe(error);
      expect(result.info.message).toBe('Network timeout');
    });

    it('keeps the passed value', () => {
      const error = new Error('Error');
      const value = { partial: 'data' };
      const result = Result.fromError(error, value);

      expect(result.value).toBe(value);
    });
  });

  describe('type safety', () => {
    it('infers types for complex objects', () => {
      interface User {
        id: number;
        username: string;
        email?: string;
      }

      const user: User = { id: 1, username: 'test' };
      const result: IResult<User> = Result.success(user);

      expect(result.value.username).toBe('test');
      expect(result.value.id).toBe(1);
    });
  });
});
