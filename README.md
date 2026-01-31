# @dcapslock/hass-jest-environment

A custom Jest environment for testing against a real Home Assistant instance using WebSocket connections with long-lived access tokens.

[![npm version](https://img.shields.io/npm/v/@dcapslock/hass-jest-environment.svg)](https://www.npmjs.com/package/@dcapslock/hass-jest-environment)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🎯 Features

- **Real WebSocket Connection**: Connect to a live Home Assistant instance
- **Long-Lived Access Tokens**: Simple authentication using Home Assistant tokens
- **Full State Access**: Access real-time entity states, services, and configuration
- **Mock Fallback Mode**: Gracefully fall back to mock mode for CI/CD pipelines
- **TypeScript Support**: Full type definitions included
- **Jest 27+**: Compatible with modern Jest versions

## 📦 Installation

```bash
npm install --save-dev @dcapslock/hass-jest-environment
```

Or with yarn:

```bash
yarn add -D @dcapslock/hass-jest-environment
```

## 🔑 Getting a Long-Lived Access Token

1. Open your Home Assistant instance
2. Click on your profile (bottom left)
3. Scroll down to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Give it a name (e.g., "Jest Testing")
6. Copy the generated token

**⚠️ Security Warning**: Never commit your access token to version control!

## ⚙️ Configuration

### Basic Setup

Add to your `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL || 'http://localhost:8123',
    accessToken: process.env.HA_TOKEN,
    mockFallback: true, // Fall back to mock mode if connection fails
    connectionTimeout: 30000, // 30 second timeout
  },
};
```

### Environment Variables

Create a `.env` file (and add it to `.gitignore`):

```bash
HA_URL=http://localhost:8123
HA_TOKEN=your_long_lived_access_token_here
```

Or set them before running tests:

```bash
HA_URL=http://localhost:8123 HA_TOKEN=your_token npm test
```

## 🚀 Usage

### Basic Test Example

```typescript
describe('Home Assistant Tests', () => {
  it('should connect to Home Assistant', () => {
    expect(hass).toBeDefined();
    expect(hass?.connected).toBe(true);
  });

  it('should retrieve entity states', () => {
    const states = hass?.states;
    expect(states).toBeDefined();
    
    // Access a specific entity
    const light = states?.['light.living_room'];
    console.log(`Light state: ${light?.state}`);
  });

  it('should list available services', () => {
    const services = hass?.services;
    expect(services?.light).toBeDefined();
    expect(services?.light?.turn_on).toBeDefined();
  });
});
```

### Template Testing Example

```typescript
describe('Template Library Tests', () => {
  it('should test template with real data', () => {
    const states = hass?.states || {};
    
    // Your template function
    const isLightOn = (entityId: string) => {
      return states[entityId]?.state === 'on';
    };

    expect(isLightOn('light.living_room')).toBeDefined();
  });
});
```

### Service Call Example

```typescript
describe('Service Call Tests', () => {
  it('should call a service', async () => {
    await hass?.callService('light', 'turn_on', {
      brightness: 255,
    }, {
      entity_id: 'light.test_light'
    });

    // Verify state changed
    const state = hass?.states['light.test_light'];
    expect(state?.state).toBe('on');
  });
});
```

## 🌐 Global Variables

The environment exposes these global variables in your tests:

### `hass`

The main Home Assistant object with:

- `hass.states`: All entity states (HassEntities)
- `hass.services`: Available services (HassServices)
- `hass.config`: Home Assistant configuration (HassConfig)
- `hass.connection`: Raw WebSocket connection
- `hass.auth`: Authentication object
- `hass.connected`: Connection status boolean
- `hass.callService(domain, service, serviceData?, target?)`: Call a service
- `hass.callWS(message)`: Send a WebSocket message
- `hass.callApi(method, path, parameters?)`: Call REST API

### `hassMode`

Current mode: `'live'` or `'mock'`

```typescript
if (hassMode === 'mock') {
  console.log('Running in mock mode, skipping test');
  return;
}
```

### `hassConnection`

The connection manager instance (HassConnection)

## 📚 API Reference

### HassEnvironmentConfig

```typescript
interface HassEnvironmentConfig {
  hassUrl?: string;           // Home Assistant URL (default: process.env.HA_URL)
  accessToken?: string;       // Long-lived access token (default: process.env.HA_TOKEN)
  mockFallback?: boolean;     // Fall back to mock mode on error (default: false)
  connectionTimeout?: number; // Connection timeout in ms (default: 30000)
}
```

### MinimalHass

```typescript
interface MinimalHass {
  auth: Auth;
  connection: Connection;
  connected: boolean;
  states: HassEntities;
  services: HassServices;
  config: HassConfig;
  callService(domain: string, service: string, serviceData?: any, target?: any): Promise<any>;
  callWS(msg: any): Promise<any>;
  callApi(method: string, path: string, parameters?: any): Promise<any>;
}
```

## 🔄 Mock Fallback Mode

When `mockFallback: true` is set, the environment will gracefully fall back to mock mode if:

- No access token is provided
- Connection to Home Assistant fails
- Authentication fails

In mock mode:
- `hassMode === 'mock'`
- `hass === null`
- Tests can check mode and skip/adapt accordingly

```typescript
it('should handle mock mode', () => {
  if (hassMode === 'mock') {
    console.warn('Skipping test in mock mode');
    return;
  }
  
  // Test with real Home Assistant
  expect(hass?.states).toBeDefined();
});
```

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with mock fallback
        run: npm test
        env:
          # Optional: Add HA_URL and HA_TOKEN secrets if you have a test instance
          # HA_URL: ${{ secrets.HA_URL }}
          # HA_TOKEN: ${{ secrets.HA_TOKEN }}
```

See [docs/ci-cd.md](./docs/ci-cd.md) for more details.

## 🐛 Troubleshooting

### Connection Issues

**Problem**: `Connection timeout` error

**Solutions**:
- Verify Home Assistant is accessible at the URL
- Check firewall settings
- Increase `connectionTimeout` in config
- Verify token is valid

### Token Issues

**Problem**: `Invalid access token format` error

**Solutions**:
- Ensure you're using a long-lived access token (not a short-lived one)
- Token should be > 50 characters
- Generate a new token in Home Assistant

### Type Issues

**Problem**: TypeScript can't find `hass` global

**Solution**: Add reference to types in your test file:

```typescript
/// <reference types="@dcapslock/hass-jest-environment" />
```

See [docs/troubleshooting.md](./docs/troubleshooting.md) for more help.

## 📖 Documentation

- [Configuration Guide](./docs/configuration.md)
- [CI/CD Integration](./docs/ci-cd.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket)
- Inspired by the need for integration testing in Home Assistant development

## 🔗 Links

- [GitHub Repository](https://github.com/dcapslock/hass-jest-environment)
- [npm Package](https://www.npmjs.com/package/@dcapslock/hass-jest-environment)
- [Home Assistant](https://www.home-assistant.io/)
- [Jest Documentation](https://jestjs.io/)

## ⚠️ Disclaimer

This package connects to a real Home Assistant instance. Tests that call services will make real changes to your system. Always test against a development instance or use mock mode for CI/CD.
