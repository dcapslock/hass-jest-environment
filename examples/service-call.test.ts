/**
 * Service call example
 * 
 * This example shows how to test service calls
 * WARNING: These tests make real changes to your Home Assistant instance!
 * Use with caution and consider testing against a development instance.
 */

describe('Home Assistant Service Calls', () => {
  it('should have callService method available', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.callService).toBeDefined();
    expect(typeof hass?.callService).toBe('function');
  });

  it('should have callWS method available', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.callWS).toBeDefined();
    expect(typeof hass?.callWS).toBe('function');
  });

  it('should have callApi method available', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    expect(hass?.callApi).toBeDefined();
    expect(typeof hass?.callApi).toBe('function');
  });

  // Example of a safe service call (get current config)
  it('should call websocket methods', async () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const result = await hass?.callWS({ type: 'get_config' });
    expect(result).toBeDefined();
    console.log(`Config retrieved via WS, version: ${result?.version}`);
  });

  // Example: Testing service availability without actually calling it
  it('should verify light service exists', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const services = hass?.services || {};
    const hasLightService = 'light' in services;
    
    if (hasLightService) {
      const lightServices = Object.keys(services.light);
      console.log(`Available light services: ${lightServices.join(', ')}`);
      expect(lightServices).toContain('turn_on');
      expect(lightServices).toContain('turn_off');
    }
  });

  /**
   * UNCOMMENT TO TEST ACTUAL SERVICE CALLS
   * WARNING: This will actually control devices in your Home Assistant!
   * 
  it('should turn on a test light', async () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    // Replace with a real entity ID from your system
    const testLightId = 'light.test_light';
    
    await hass?.callService('light', 'turn_on', {}, { entity_id: testLightId });
    
    // Wait a bit for state to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = hass?.states[testLightId];
    expect(state?.state).toBe('on');
  });
  */
});
