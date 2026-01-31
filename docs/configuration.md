# Configuration Guide

This guide covers all configuration options for `@dcapslock/hass-jest-environment`.

## Jest Configuration

### Basic Configuration (Node Environment)

The simplest configuration in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
};
```

This will use default values and read from environment variables.

### Basic Configuration (jsdom Environment)

For DOM/UI testing (custom cards, UI components):

```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment/jsdom',
};
```

This provides both DOM APIs and Home Assistant integration.

### Full Configuration

```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: 'http://homeassistant.local:8123',
    accessToken: process.env.HA_TOKEN,
    mockFallback: true,
    connectionTimeout: 30000,
  },
};
```

### Mixed Environments (Node + jsdom)

Use different environments for different test files:

```javascript
// jest.config.js - default to Node
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL,
    accessToken: process.env.HA_TOKEN,
    mockFallback: true,
  },
};
```

Then use docblock comments in specific test files:

```typescript
/**
 * @jest-environment @dcapslock/hass-jest-environment/jsdom
 */

// This file uses jsdom environment
describe('Card Tests', () => {
  // Has DOM + HA access
});
```

## Configuration Options

### `hassUrl`

- **Type**: `string`
- **Default**: `process.env.HA_URL || 'http://localhost:8123'`
- **Description**: The URL of your Home Assistant instance

Examples:
```javascript
hassUrl: 'http://localhost:8123'
hassUrl: 'http://homeassistant.local:8123'
hassUrl: 'https://my-home.duckdns.org:8123'
```

### `accessToken`

- **Type**: `string`
- **Default**: `process.env.HA_TOKEN`
- **Description**: Long-lived access token from Home Assistant

**Important**: Never hardcode tokens in your config. Always use environment variables.

```javascript
// ✅ Good
accessToken: process.env.HA_TOKEN

// ❌ Bad - never do this
accessToken: 'eyJ0eXAiOiJKV1QiLCJhbG...'
```

### `mockFallback`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to fall back to mock mode if connection fails

When enabled:
- Tests won't fail if Home Assistant is unavailable
- `hassMode` will be `'mock'` and `hass` will be `null`
- Useful for CI/CD environments

```javascript
// Recommended for CI/CD
mockFallback: true

// Recommended for local development (fail fast on connection issues)
mockFallback: false
```

### `connectionTimeout`

- **Type**: `number`
- **Default**: `30000` (30 seconds)
- **Description**: Maximum time to wait for connection in milliseconds

Adjust based on your network and Home Assistant instance:

```javascript
// Fast local network
connectionTimeout: 10000  // 10 seconds

// Remote connection or slow network
connectionTimeout: 60000  // 60 seconds
```

## Environment Variables

### Using .env Files

Create a `.env` file in your project root:

```bash
HA_URL=http://localhost:8123
HA_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Important**: Add `.env` to your `.gitignore`:

```gitignore
.env
.env.local
.env.test
```

### Loading .env Files

Install dotenv:

```bash
npm install --save-dev dotenv
```

Load in jest.config.js:

```javascript
require('dotenv').config();

module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL,
    accessToken: process.env.HA_TOKEN,
  },
};
```

### Command Line

Set variables when running tests:

```bash
# Linux/macOS
HA_URL=http://localhost:8123 HA_TOKEN=your_token npm test

# Windows (cmd)
set HA_URL=http://localhost:8123 && set HA_TOKEN=your_token && npm test

# Windows (PowerShell)
$env:HA_URL="http://localhost:8123"; $env:HA_TOKEN="your_token"; npm test
```

## Multiple Configuration Files

### Development vs CI/CD

Create separate configs:

**jest.config.js** (development):
```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL || 'http://localhost:8123',
    accessToken: process.env.HA_TOKEN,
    mockFallback: false,  // Fail if not connected
  },
};
```

**jest.config.ci.js** (CI/CD):
```javascript
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL,
    accessToken: process.env.HA_TOKEN,
    mockFallback: true,  // Don't fail in CI
  },
};
```

Use with:
```bash
# Development
npm test

# CI
jest --config jest.config.ci.js
```

## Per-Test Configuration

You can also configure per test file using docblock:

```typescript
/**
 * @jest-environment @dcapslock/hass-jest-environment
 * @jest-environment-options {"mockFallback": true}
 */

describe('My Tests', () => {
  // Tests here
});
```

## TypeScript Configuration

For TypeScript support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["jest", "@dcapslock/hass-jest-environment"]
  }
}
```

Or add a reference in your test files:

```typescript
/// <reference types="@dcapslock/hass-jest-environment" />
```

## Security Best Practices

1. **Never commit tokens**:
   ```gitignore
   .env
   .env.*
   !.env.example
   ```

2. **Use different tokens for different environments**:
   - Development: Local instance token
   - CI/CD: Test instance token (if available)
   - Never use production tokens in tests

3. **Limit token permissions**:
   - Create a dedicated Home Assistant user for testing
   - Give minimal necessary permissions

4. **Rotate tokens regularly**:
   - Regenerate tokens periodically
   - Revoke old tokens

5. **Use secrets management in CI**:
   ```yaml
   # GitHub Actions
   env:
     HA_TOKEN: ${{ secrets.HA_TOKEN }}
   ```

## Troubleshooting Configuration

### Check Configuration is Loaded

Add logging to your config:

```javascript
const config = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    hassUrl: process.env.HA_URL || 'http://localhost:8123',
    accessToken: process.env.HA_TOKEN,
    mockFallback: true,
  },
};

console.log('Jest Config:', {
  hassUrl: config.testEnvironmentOptions.hassUrl,
  hasToken: !!config.testEnvironmentOptions.accessToken,
  mockFallback: config.testEnvironmentOptions.mockFallback,
});

module.exports = config;
```

### Verify Environment Variables

```bash
# Linux/macOS
echo $HA_URL
echo $HA_TOKEN

# Windows (cmd)
echo %HA_URL%
echo %HA_TOKEN%

# Windows (PowerShell)
$env:HA_URL
$env:HA_TOKEN
```

### Test Connection Separately

Create a test file:

```typescript
describe('Connection Test', () => {
  it('should show connection details', () => {
    console.log('Mode:', hassMode);
    console.log('Connected:', hass?.connected);
    console.log('Has states:', !!hass?.states);
    console.log('Entity count:', Object.keys(hass?.states || {}).length);
  });
});
```

Run with verbose output:
```bash
npm test -- --verbose
```
