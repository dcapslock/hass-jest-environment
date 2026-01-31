# Troubleshooting Guide

This guide helps you resolve common issues with `@dcapslock/hass-jest-environment`.

## Connection Issues

### Error: Connection timeout after 30000ms

**Symptoms**:
```
Error: Connection timeout after 30000ms
```

**Causes**:
1. Home Assistant is not running
2. Wrong URL
3. Network/firewall blocking connection
4. Home Assistant is too slow to respond

**Solutions**:

1. **Verify Home Assistant is running**:
   ```bash
   curl http://localhost:8123
   ```

2. **Check the URL**:
   ```javascript
   // Make sure URL is correct
   hassUrl: 'http://localhost:8123'  // ✅ Correct
   hassUrl: 'localhost:8123'          // ❌ Missing protocol
   hassUrl: 'http://localhost:8124'   // ❌ Wrong port
   ```

3. **Increase timeout**:
   ```javascript
   testEnvironmentOptions: {
     connectionTimeout: 60000,  // 60 seconds
   }
   ```

4. **Test connection manually**:
   ```bash
   curl -v http://localhost:8123/api/
   ```

### Error: Failed to connect to Home Assistant

**Symptoms**:
```
Error: Failed to connect to Home Assistant at http://localhost:8123: [error details]
```

**Causes**:
- Network connectivity issues
- SSL/TLS certificate problems
- Firewall blocking WebSocket connections

**Solutions**:

1. **For SSL/TLS issues with self-signed certificates**:
   ```javascript
   // Note: Not recommended for production
   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
   ```

2. **Check WebSocket connection**:
   ```bash
   # Install wscat if needed
   npm install -g wscat
   
   # Test WebSocket
   wscat -c ws://localhost:8123/api/websocket
   ```

3. **Verify Home Assistant API is accessible**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8123/api/
   ```

## Authentication Issues

### Error: Invalid access token format

**Symptoms**:
```
Error: Invalid access token format. Please provide a valid Home Assistant long-lived access token.
```

**Causes**:
- Using a short-lived token instead of long-lived
- Token is corrupted or incomplete
- Token contains invalid characters

**Solutions**:

1. **Generate a new long-lived token**:
   - Home Assistant → Profile → Long-Lived Access Tokens
   - Click "Create Token"
   - Copy the entire token

2. **Verify token format**:
   ```javascript
   // Valid token is typically 150+ characters
   // Example (truncated): eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
   console.log('Token length:', process.env.HA_TOKEN?.length);
   ```

3. **Check for whitespace**:
   ```javascript
   // Trim whitespace
   accessToken: process.env.HA_TOKEN?.trim()
   ```

### Error: Authentication failed

**Symptoms**:
- Connection established but authentication fails
- "Unauthorized" or 401 errors

**Solutions**:

1. **Verify token is valid**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8123/api/
   ```
   Should return: `{"message": "API running."}`

2. **Check token hasn't been revoked**:
   - Go to Home Assistant → Profile → Long-Lived Access Tokens
   - Verify token still exists
   - Generate a new one if needed

3. **Ensure token has necessary permissions**:
   - Token should have full access to API
   - User should not be restricted

## TypeScript Issues

### Error: Cannot find name 'hass'

**Symptoms**:
```typescript
error TS2304: Cannot find name 'hass'.
```

**Solutions**:

1. **Add type reference at top of test file**:
   ```typescript
   /// <reference types="@dcapslock/hass-jest-environment" />
   
   describe('My Tests', () => {
     it('should access hass', () => {
       expect(hass).toBeDefined();
     });
   });
   ```

2. **Update tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "types": ["jest", "@dcapslock/hass-jest-environment"]
     }
   }
   ```

3. **Ensure package is installed**:
   ```bash
   npm install --save-dev @dcapslock/hass-jest-environment
   ```

### Error: Module not found

**Symptoms**:
```
Cannot find module '@dcapslock/hass-jest-environment'
```

**Solutions**:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verify package in node_modules**:
   ```bash
   ls node_modules/@dcapslock/hass-jest-environment
   ```

## Jest Configuration Issues

### Error: Test environment not found

**Symptoms**:
```
Error: Cannot find module '@dcapslock/hass-jest-environment'
```

**Causes**:
- Package not installed
- Wrong environment name in config
- Build artifacts missing

**Solutions**:

1. **Check jest.config.js syntax**:
   ```javascript
   module.exports = {
     testEnvironment: '@dcapslock/hass-jest-environment',  // ✅ Correct
   };
   ```

2. **Verify package.json**:
   ```json
   {
     "devDependencies": {
       "@dcapslock/hass-jest-environment": "^1.0.0"
     }
   }
   ```

3. **Rebuild if using from source**:
   ```bash
   cd node_modules/@dcapslock/hass-jest-environment
   npm run build
   ```

### Tests Running in Wrong Environment

**Symptoms**:
- `hass` is undefined
- Tests don't connect to Home Assistant

**Solutions**:

1. **Verify environment is applied**:
   ```typescript
   describe('Test', () => {
     it('should show environment', () => {
       console.log('Has hass:', typeof hass);
       console.log('Mode:', typeof hassMode);
     });
   });
   ```

2. **Check for conflicting configs**:
   ```bash
   # Look for multiple config files
   find . -name "jest.config.*"
   ```

3. **Use explicit config**:
   ```bash
   jest --config jest.config.js
   ```

## Runtime Issues

### Error: states/services undefined

**Symptoms**:
```typescript
hass?.states  // undefined
hass?.services  // undefined
```

**Causes**:
- Connection succeeded but data fetch failed
- Timing issue during setup

**Solutions**:

1. **Check hassMode**:
   ```typescript
   it('should have data', () => {
     console.log('Mode:', hassMode);
     if (hassMode === 'mock') {
       console.log('Running in mock mode');
       return;
     }
     expect(hass?.states).toBeDefined();
   });
   ```

2. **Add delay for slow connections**:
   ```typescript
   beforeAll(async () => {
     if (hassMode === 'live') {
       await new Promise(resolve => setTimeout(resolve, 2000));
     }
   });
   ```

3. **Check Home Assistant is responsive**:
   ```bash
   curl http://localhost:8123/api/states
   ```

### Tests Hanging

**Symptoms**:
- Tests never complete
- Jest doesn't exit

**Solutions**:

1. **Add test timeout**:
   ```javascript
   // jest.config.js
   module.exports = {
     testTimeout: 30000,  // 30 seconds
   };
   ```

2. **Check for unclosed connections**:
   ```typescript
   afterAll(async () => {
     // Connections are closed automatically
     // But you can force close if needed
     await hassConnection?.disconnect();
   });
   ```

3. **Force exit Jest**:
   ```bash
   jest --forceExit
   ```

## Performance Issues

### Tests Running Slowly

**Symptoms**:
- Each test takes several seconds
- Test suite takes minutes to complete

**Solutions**:

1. **Reduce connection setup**:
   ```javascript
   // Use setupFilesAfterEnv to share connection
   testEnvironmentOptions: {
     connectionTimeout: 10000,  // Reduce timeout
   }
   ```

2. **Run tests serially**:
   ```bash
   jest --runInBand
   ```

3. **Limit test files**:
   ```bash
   jest examples/basic-test.test.ts
   ```

4. **Use mock mode for unit tests**:
   ```typescript
   if (hassMode === 'mock') {
     // Fast mock tests
   } else {
     // Slower integration tests
   }
   ```

## CI/CD Issues

### Tests Pass Locally but Fail in CI

**Symptoms**:
- Works on local machine
- Fails in GitHub Actions/GitLab CI/etc.

**Solutions**:

1. **Enable mock fallback**:
   ```javascript
   testEnvironmentOptions: {
     mockFallback: true,
   }
   ```

2. **Check environment variables**:
   ```yaml
   # GitHub Actions
   - name: Debug
     run: |
       echo "Has HA_URL: ${{ env.HA_URL != '' }}"
       echo "Has HA_TOKEN: ${{ env.HA_TOKEN != '' }}"
   ```

3. **Match Node versions**:
   ```yaml
   # Use same Node version as local
   - uses: actions/setup-node@v3
     with:
       node-version: '18'
   ```

### Secrets Not Working

**Symptoms**:
- Environment variables not set in CI
- Connection fails with "no token" error

**Solutions**:

1. **Verify secrets are set**:
   - GitHub: Settings → Secrets and variables → Actions
   - GitLab: Settings → CI/CD → Variables

2. **Check secret names match**:
   ```yaml
   env:
     HA_TOKEN: ${{ secrets.HA_TOKEN }}  # ✅ Name must match
   ```

3. **Enable for pull requests** (if needed):
   - Some CI systems don't expose secrets to external PRs
   - Use mockFallback for untrusted PRs

## Debugging Tips

### Enable Verbose Logging

```bash
# Run with verbose output
DEBUG=* npm test

# Jest verbose
npm test -- --verbose

# Show console.log output
npm test -- --silent=false
```

### Add Debug Logging

```typescript
describe('Debug Test', () => {
  it('should show debug info', () => {
    console.log({
      hassMode,
      hasHass: !!hass,
      connected: hass?.connected,
      stateCount: Object.keys(hass?.states || {}).length,
      serviceCount: Object.keys(hass?.services || {}).length,
      config: hass?.config,
    });
  });
});
```

### Test Connection Separately

Create a standalone test:

```typescript
// connection-test.ts
import { HassConnection } from '@dcapslock/hass-jest-environment';

async function testConnection() {
  const conn = new HassConnection();
  
  try {
    const { auth, connection } = await conn.connect({
      hassUrl: process.env.HA_URL || 'http://localhost:8123',
      accessToken: process.env.HA_TOKEN!,
      timeout: 10000,
    });
    
    console.log('✅ Connection successful');
    console.log('Auth:', auth.data.hassUrl);
    console.log('Connected:', connection.connected);
    
    await conn.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

Run with:
```bash
HA_URL=http://localhost:8123 HA_TOKEN=your_token ts-node connection-test.ts
```

## Getting Help

If you're still experiencing issues:

1. **Check GitHub Issues**: https://github.com/dcapslock/hass-jest-environment/issues
2. **Create a minimal reproduction**
3. **Include**:
   - Error messages
   - Configuration files
   - Node/npm versions
   - Home Assistant version
   - What you've tried

### Minimal Reproduction Template

```typescript
// jest.config.js
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    // Your config
  },
};

// test.test.ts
describe('Reproduction', () => {
  it('should demonstrate issue', () => {
    console.log('hassMode:', hassMode);
    console.log('hass:', hass);
    // Your failing test
  });
});
```

```bash
# Include versions
node --version
npm --version
npm list @dcapslock/hass-jest-environment
```
