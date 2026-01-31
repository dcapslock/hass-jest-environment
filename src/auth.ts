import { Auth } from 'home-assistant-js-websocket';

/**
 * Custom Auth class for long-lived access tokens.
 * These tokens don't expire in the traditional sense, so we don't need refresh logic.
 */
export class LongLivedTokenAuth extends Auth {
  constructor(hassUrl: string, accessToken: string) {
    super({
      hassUrl,
      clientId: 'jest-environment',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      refresh_token: '',
      access_token: accessToken,
      expires_in: 60 * 60 * 24 * 365 * 10,
    });
  }

  /**
   * Override refresh - long-lived tokens don't need refreshing
   */
  async refreshAccessToken(): Promise<void> {
    // No-op for long-lived tokens
    return Promise.resolve();
  }

  /**
   * Validate token format
   * Home Assistant long-lived tokens are typically long alphanumeric strings
   */
  static validateToken(token: string): boolean {
    return token.length > 50 && /^[A-Za-z0-9_\-\.]+$/.test(token);
  }
}
