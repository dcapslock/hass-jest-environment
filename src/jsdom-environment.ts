import JsdomEnvironment from 'jest-environment-jsdom';
import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import { HassConnection } from './connection';
import { HassBuilder, MinimalHass } from './hass-builder';
import type { HassEnvironmentConfig } from './environment';

/**
 * Custom Jest Environment with jsdom that provides a real Home Assistant connection
 *
 * Use this environment when you need both DOM APIs (for testing UI components)
 * and Home Assistant integration.
 *
 * Configuration via jest.config.js:
 *
 * ```js
 * module.exports = {
 *   testEnvironment: '@dcapslock/hass-jest-environment/jsdom',
 *   testEnvironmentOptions: {
 *     hassUrl: process.env.HA_URL || 'http://localhost:8123',
 *     accessToken: process.env.HA_TOKEN,
 *     mockFallback: true,
 *     connectionTimeout: 30000
 *   }
 * };
 * ```
 */
export default class HassJsdomEnvironment extends JsdomEnvironment {
  private hassConnection: HassConnection | null = null;
  private hass: MinimalHass | null = null;
  private config: HassEnvironmentConfig;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);

    this.config = {
      hassUrl: process.env.HA_URL || 'http://localhost:8123',
      accessToken: process.env.HA_TOKEN,
      mockFallback: false,
      connectionTimeout: 30000,
      ...config.projectConfig.testEnvironmentOptions,
    };
  }

  async setup(): Promise<void> {
    await super.setup();

    const { hassUrl, accessToken, mockFallback, connectionTimeout } = this.config;

    // Check if we have required configuration
    if (!accessToken) {
      if (mockFallback) {
        console.warn('⚠️  No HA_TOKEN provided, running in mock mode');
        this.global.hass = null;
        this.global.hassMode = 'mock';
        return;
      }
      throw new Error(
        'HA_TOKEN environment variable is required. ' +
          'Generate one in Home Assistant: Profile → Long-Lived Access Tokens'
      );
    }

    try {
      // Create connection
      this.hassConnection = new HassConnection();
      const { auth, connection } = await this.hassConnection.connect({
        hassUrl: hassUrl!,
        accessToken,
        timeout: connectionTimeout,
      });

      // Build hass object
      this.hass = await HassBuilder.build(auth, connection);

      // Expose to tests
      this.global.hass = this.hass;
      this.global.hassMode = 'live';
      this.global.hassConnection = this.hassConnection;

      console.log(`✅ Connected to Home Assistant at ${hassUrl}`);
    } catch (error) {
      if (mockFallback) {
        console.warn(
          `⚠️  Failed to connect to Home Assistant, falling back to mock mode: ${error}`
        );
        this.global.hass = null;
        this.global.hassMode = 'mock';
      } else {
        throw error;
      }
    }
  }

  async teardown(): Promise<void> {
    if (this.hassConnection) {
      await this.hassConnection.disconnect();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}
