import { HassEntities } from 'home-assistant-js-websocket';

/**
 * Simple state snapshot manager for test isolation
 */
export class StateManager {
  private snapshots: Map<string, HassEntities> = new Map();

  saveSnapshot(name: string, states: HassEntities): void {
    this.snapshots.set(name, JSON.parse(JSON.stringify(states)));
  }

  getSnapshot(name: string): HassEntities | undefined {
    return this.snapshots.get(name);
  }

  clearSnapshot(name: string): void {
    this.snapshots.delete(name);
  }

  clearAll(): void {
    this.snapshots.clear();
  }
}
