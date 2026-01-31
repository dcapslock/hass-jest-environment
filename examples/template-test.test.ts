/**
 * Template testing example
 *
 * This example shows how to use the environment for testing Home Assistant templates
 * or template-based libraries
 */

describe('Home Assistant Template Tests', () => {
  it('should test template with real entity states', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const states = hass?.states || {};
    const sensorEntities = Object.keys(states).filter((id) => id.startsWith('sensor.'));

    if (sensorEntities.length > 0) {
      const sensorId = sensorEntities[0];
      const sensor = states[sensorId];

      // Example: Test a template function that formats sensor data
      const formatSensorValue = (state: string, unit?: string) => {
        return unit ? `${state} ${unit}` : state;
      };

      const unit = sensor.attributes.unit_of_measurement;
      const formatted = formatSensorValue(sensor.state, unit);

      console.log(`Formatted sensor: ${formatted}`);
      expect(formatted).toContain(sensor.state);
    }
  });

  it('should test entity availability template', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const states = hass?.states || {};

    // Example: Template that checks entity availability
    const isEntityAvailable = (entityId: string) => {
      const entity = states[entityId];
      return entity && entity.state !== 'unavailable' && entity.state !== 'unknown';
    };

    const entityIds = Object.keys(states).slice(0, 5);
    const availableCount = entityIds.filter(isEntityAvailable).length;

    console.log(`${availableCount} out of ${entityIds.length} entities are available`);
    expect(availableCount).toBeGreaterThanOrEqual(0);
  });

  it('should test state filtering template', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const states = hass?.states || {};

    // Example: Template that filters lights that are on
    const getEntitiesOn = (domain: string) => {
      return Object.entries(states)
        .filter(([id, state]) => id.startsWith(`${domain}.`) && state.state === 'on')
        .map(([id]) => id);
    };

    const lightsOn = getEntitiesOn('light');
    console.log(`Lights currently on: ${lightsOn.join(', ') || 'none'}`);
    expect(Array.isArray(lightsOn)).toBe(true);
  });

  it('should test attribute extraction template', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    const states = hass?.states || {};

    // Example: Extract friendly names
    const getFriendlyNames = (entityIds: string[]) => {
      return entityIds.map((id) => {
        const entity = states[id];
        return entity?.attributes?.friendly_name || id;
      });
    };

    const entityIds = Object.keys(states).slice(0, 3);
    const friendlyNames = getFriendlyNames(entityIds);

    console.log(`Entity friendly names: ${friendlyNames.join(', ')}`);
    expect(friendlyNames.length).toBe(entityIds.length);
  });
});
