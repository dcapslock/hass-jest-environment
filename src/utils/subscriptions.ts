import { Connection, HassEntities } from 'home-assistant-js-websocket';

/**
 * Utility to wait for a specific entity state
 */
export async function waitForState(
  connection: Connection,
  entityId: string,
  expectedState: string,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${entityId} to reach state ${expectedState}`));
    }, timeout);

    const checkState = (entities: HassEntities) => {
      if (entities[entityId]?.state === expectedState) {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    connection.subscribeMessage(checkState, { type: 'subscribe_entities' });
  });
}
