/**
 * Basic test example showing how to access Home Assistant states
 *
 * Run with:
 * HA_URL=http://localhost:8123 HA_TOKEN=your_token jest examples/basic-test.test.ts
 */

describe('Home Assistant Basic Tests', () => {
  it('should connect to Home Assistant', () => {
    expect(hassMode).toBeDefined();
    if (hassMode === 'mock') {
      console.log('Running in mock mode');
      return;
    }

    expect(hass).toBeDefined();
    expect(hass?.connected).toBe(true);
  });

  it('should retrieve entity states', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.states).toBeDefined();
    const entityCount = Object.keys(hass?.states || {}).length;
    console.log(`Found ${entityCount} entities`);
    expect(entityCount).toBeGreaterThan(0);
  });

  it('should access specific entity state', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const states = hass?.states || {};
    const entityIds = Object.keys(states);

    if (entityIds.length > 0) {
      const firstEntity = states[entityIds[0]];
      console.log(`First entity: ${entityIds[0]} = ${firstEntity.state}`);

      expect(firstEntity).toBeDefined();
      expect(firstEntity.state).toBeDefined();
      expect(firstEntity.attributes).toBeDefined();
    }
  });

  it('should have available services', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.services).toBeDefined();
    const domains = Object.keys(hass?.services || {});
    console.log(`Available service domains: ${domains.join(', ')}`);
    expect(domains.length).toBeGreaterThan(0);
  });

  it('should have configuration', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.config).toBeDefined();
    console.log(`Home Assistant version: ${hass?.config.version}`);
    console.log(`Location: ${hass?.config.location_name}`);
  });
});
