import { describe, it, expect } from 'vitest';
import {
  isAuthenticatedSession,
  hasGraphApiToken,
  createMinimalSessionState,
} from '../session.js';

describe('session guards', () => {
  it('isAuthenticatedSession is true when sessionid cookie exists', () => {
    const state = {
      ...createMinimalSessionState('user1'),
      cookies: { sessionid: 'abc' },
    };

    expect(isAuthenticatedSession(state)).toBe(true);
  });

  it('isAuthenticatedSession is false without sessionid', () => {
    expect(isAuthenticatedSession(createMinimalSessionState('user1'))).toBe(false);
    expect(isAuthenticatedSession(null)).toBe(false);
    expect(isAuthenticatedSession(undefined)).toBe(false);
  });

  it('hasGraphApiToken is true when a Graph API token exists', () => {
    const state = createMinimalSessionState('user1', 'graph-token');

    expect(hasGraphApiToken(state)).toBe(true);
    expect(hasGraphApiToken(createMinimalSessionState('user1'))).toBe(false);
    expect(hasGraphApiToken(null)).toBe(false);
  });

  it('createMinimalSessionState builds a browser-mode state', () => {
    const state = createMinimalSessionState('user1', 'graph-token');

    expect(state.sessionId).toBe('user1');
    expect(state.sessionMode).toBe('browser');
    expect(state.tokens.graphApiToken).toBe('graph-token');
    expect(state.cookies).toEqual({});
    expect(state.createdAt).toBeInstanceOf(Date);
  });
});
