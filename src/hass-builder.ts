import {
  Connection,
  Auth,
  subscribeEntities,
  subscribeServices,
  subscribeConfig,
  HassEntities,
  HassServices,
  HassConfig,
} from 'home-assistant-js-websocket';

export interface MinimalHass {
  auth: Auth;
  connection: Connection;
  connected: boolean;
  states: HassEntities;
  services: HassServices;
  config: HassConfig;
  callService: (domain: string, service: string, serviceData?: any, target?: any) => Promise<any>;
  callWS: (msg: any) => Promise<any>;
  callApi: (method: string, path: string, parameters?: any) => Promise<any>;
}

export class HassBuilder {
  /**
   * Build a minimal hass object with real-time data from Home Assistant
   */
  static async build(auth: Auth, connection: Connection): Promise<MinimalHass> {
    let states: HassEntities = {};
    let services: HassServices = {};
    let config: HassConfig | null = null;

    // Subscribe to entities and wait for initial data
    await new Promise<void>((resolve) => {
      const unsub = subscribeEntities(connection, (entities) => {
        states = entities;
        unsub();
        resolve();
      });
    });

    // Subscribe to services and wait for initial data
    await new Promise<void>((resolve) => {
      const unsub = subscribeServices(connection, (servicesData) => {
        services = servicesData;
        unsub();
        resolve();
      });
    });

    // Get config
    await new Promise<void>((resolve) => {
      const unsub = subscribeConfig(connection, (configData) => {
        config = configData;
        unsub();
        resolve();
      });
    });

    if (!config) {
      throw new Error('Failed to retrieve Home Assistant configuration');
    }

    // Build the hass object
    const hass: MinimalHass = {
      auth,
      connection,
      connected: true,
      states,
      services,
      config,
      callService: async (domain, service, serviceData, target) => {
        return connection.sendMessagePromise({
          type: 'call_service',
          domain,
          service,
          service_data: serviceData,
          target,
        });
      },
      callWS: (msg) => connection.sendMessagePromise(msg),
      callApi: async (method, path, parameters) => {
        const url = `${auth.data.hassUrl}${path}`;
        const headers: HeadersInit = {
          authorization: `Bearer ${auth.data.access_token}`,
          'Content-Type': 'application/json',
        };

        const init: RequestInit = {
          method,
          headers,
        };

        if (parameters) {
          init.body = JSON.stringify(parameters);
        }

        const response = await fetch(url, init);
        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }
        return response.json();
      },
    };

    return hass;
  }
}
