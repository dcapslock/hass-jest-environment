import type { MinimalHass } from './hass-builder';
import type { HassConnection } from './connection';

declare global {
  namespace NodeJS {
    interface Global {
      hass: MinimalHass | null;
      hassMode: 'live' | 'mock';
      hassConnection: HassConnection;
    }
  }

  var hass: MinimalHass | null;
  var hassMode: 'live' | 'mock';
  var hassConnection: HassConnection;
}

export {};
