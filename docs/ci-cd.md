# CI/CD Integration Guide

This guide covers how to integrate `@dcapslock/hass-jest-environment` into various CI/CD pipelines.

## Overview

When running tests in CI/CD, you typically have two options:

1. **Mock Mode**: Run tests without connecting to Home Assistant
2. **Live Mode**: Connect to a test Home Assistant instance

Most projects will use mock mode in CI/CD for:
- Speed
- Reliability
- No external dependencies
- Security (no need to expose tokens)

## Mock Mode Strategy

### Enable Mock Fallback

Configure Jest to gracefully handle missing connections:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    mockFallback: true,  // Key setting for CI/CD
  },
};
```

### Write CI-Friendly Tests

```typescript
describe('My Tests', () => {
  it('should work in both live and mock mode', () => {
    if (hassMode === 'mock') {
      console.log('Running in mock mode');
      // Test logic that doesn't require real Home Assistant
      expect(true).toBe(true);
      return;
    }

    // Test with real Home Assistant
    expect(hass?.states).toBeDefined();
  });
});
```

## GitHub Actions

### Basic Setup (Mock Mode)

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

Tests will run in mock mode automatically since no `HA_TOKEN` is provided.

### With Test Home Assistant Instance

If you have a test Home Assistant instance available:

```yaml
name: Tests with Live HA

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          HA_URL: ${{ secrets.HA_URL }}
          HA_TOKEN: ${{ secrets.HA_TOKEN }}
        run: npm test
```

### Matrix Testing

Test against multiple Node versions:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm test
```

## GitLab CI

### Basic Setup (Mock Mode)

```yaml
# .gitlab-ci.yml
image: node:18

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm test
```

### With Test Instance

```yaml
# .gitlab-ci.yml
image: node:18

variables:
  HA_URL: $HA_URL
  HA_TOKEN: $HA_TOKEN

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm test
```

Add `HA_URL` and `HA_TOKEN` as CI/CD variables in GitLab:
Settings → CI/CD → Variables

## CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}
      - run:
          name: Run tests
          command: npm test

workflows:
  version: 2
  test:
    jobs:
      - test
```

## Travis CI

```yaml
# .travis.yml
language: node_js
node_js:
  - '18'
  - '20'

cache:
  directories:
    - node_modules

install:
  - npm ci

script:
  - npm test
```

## Azure Pipelines

```yaml
# azure-pipelines.yml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

strategy:
  matrix:
    node_18:
      node_version: '18.x'
    node_20:
      node_version: '20.x'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: $(node_version)
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - script: npm test
    displayName: 'Run tests'
```

## Docker-based Testing

### Run Home Assistant in Docker for Tests

```yaml
# docker-compose.yml
version: '3'
services:
  homeassistant:
    image: homeassistant/home-assistant:latest
    ports:
      - "8123:8123"
    volumes:
      - ./test-config:/config
```

GitHub Actions with Docker:

```yaml
name: Tests with Docker HA

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      homeassistant:
        image: homeassistant/home-assistant:stable
        ports:
          - 8123:8123
        options: >-
          --health-cmd "curl -f http://localhost:8123 || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      
      - name: Wait for Home Assistant
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8123; do sleep 2; done'
      
      - name: Run tests
        env:
          HA_URL: http://localhost:8123
          HA_TOKEN: ${{ secrets.HA_TOKEN }}
        run: npm test
```

## Managing Secrets

### GitHub Actions

1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `HA_URL`: Your test instance URL
   - `HA_TOKEN`: Long-lived access token

### GitLab CI

1. Go to Settings → CI/CD → Variables
2. Add variables:
   - Key: `HA_URL`, Value: Your URL
   - Key: `HA_TOKEN`, Value: Your token
   - Mark as "Masked" and "Protected"

### CircleCI

1. Go to Project Settings → Environment Variables
2. Add:
   - `HA_URL`
   - `HA_TOKEN`

## Best Practices

### 1. Use Mock Mode by Default

```javascript
// jest.config.js
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    mockFallback: true,  // Always enabled in base config
  },
};
```

### 2. Separate Test Suites

Use different configs for integration tests:

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.js",
    "test:ci": "jest --config jest.ci.config.js"
  }
}
```

### 3. Conditional Test Execution

```typescript
const runIntegrationTests = process.env.RUN_INTEGRATION === 'true';

(runIntegrationTests ? describe : describe.skip)('Integration Tests', () => {
  it('should connect to HA', () => {
    expect(hass?.connected).toBe(true);
  });
});
```

### 4. Timeout Configuration

Increase timeouts for integration tests:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: '@dcapslock/hass-jest-environment',
  testEnvironmentOptions: {
    connectionTimeout: 60000,  // 60 seconds for CI
  },
  testTimeout: 30000,  // 30 second test timeout
};
```

### 5. Parallel Execution

Control parallelism to avoid overwhelming Home Assistant:

```bash
# Run serially
jest --runInBand

# Limit workers
jest --maxWorkers=2
```

## Troubleshooting CI Issues

### Tests Timing Out

```javascript
// Increase timeouts
testEnvironmentOptions: {
  connectionTimeout: 120000,  // 2 minutes
}
```

### Connection Refused

```yaml
# Add retry logic
- name: Run tests with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm test
```

### Flaky Tests

```typescript
// Add explicit waits
it('should handle delayed state', async () => {
  if (hassMode === 'mock') return;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  expect(hass?.states).toBeDefined();
});
```

### Environment Variable Issues

```yaml
# Debug step
- name: Debug environment
  run: |
    echo "HA_URL is set: ${{ secrets.HA_URL != '' }}"
    echo "HA_TOKEN is set: ${{ secrets.HA_TOKEN != '' }}"
```

## Example: Complete GitHub Actions Workflow

```yaml
name: Complete Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint

  test-unit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
        name: Run tests in mock mode

  test-integration:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
        name: Run tests with live HA
        env:
          HA_URL: ${{ secrets.HA_URL }}
          HA_TOKEN: ${{ secrets.HA_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```
