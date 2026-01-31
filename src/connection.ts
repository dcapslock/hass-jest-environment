import { createConnection, Connection, Auth } from 'home-assistant-js-websocket';
import { LongLivedTokenAuth } from './auth';

export interface ConnectionConfig {
  hassUrl: string;
  accessToken: string;
  timeout?: number;
}

export class HassConnection {
  private auth: Auth | null = null;
  private connection: Connection | null = null;

  async connect(config: ConnectionConfig): Promise<{ auth: Auth; connection: Connection }> {
    const { hassUrl, accessToken, timeout = 30000 } = config;

    // Validate token
    if (!LongLivedTokenAuth.validateToken(accessToken)) {
      throw new Error(
        'Invalid access token format. Please provide a valid Home Assistant long-lived access token.'
      );
    }

    // Create auth
    this.auth = new LongLivedTokenAuth(hassUrl, accessToken);

    // Create connection with timeout
    const connectionPromise = createConnection({ auth: this.auth });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timeout after ${timeout}ms`)), timeout)
    );

    try {
      this.connection = await Promise.race([connectionPromise, timeoutPromise]);
      return { auth: this.auth, connection: this.connection };
    } catch (error) {
      throw new Error(`Failed to connect to Home Assistant at ${hassUrl}: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.auth = null;
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  getAuth(): Auth | null {
    return this.auth;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
