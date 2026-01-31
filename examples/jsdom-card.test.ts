/**
 * @jest-environment @dcapslock/hass-jest-environment/jsdom
 *
 * Example showing how to test UI components/cards that need both:
 * - DOM APIs (document, window, etc.)
 * - Home Assistant state and services
 *
 * Run with:
 * HA_URL=http://localhost:8123 HA_TOKEN=your_token jest examples/jsdom-card.test.ts
 */

describe('Custom Card with jsdom Tests', () => {
  it('should have access to both DOM and Home Assistant', () => {
    if (hassMode === 'mock') {
      console.log('Running in mock mode, skipping DOM tests');
      return;
    }

    // Verify DOM APIs are available
    expect(window).toBeDefined();
    expect(document).toBeDefined();
    expect(document.createElement).toBeDefined();

    // Verify Home Assistant is available
    expect(hass).toBeDefined();
    expect(hass?.states).toBeDefined();
    expect(hass?.services).toBeDefined();
  });

  it('should render a custom card with live HA data', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    // Create a mock custom card element
    const card = document.createElement('div');
    card.className = 'custom-card';
    document.body.appendChild(card);

    // Get real Home Assistant data
    const states = hass?.states || {};
    const entityIds = Object.keys(states);

    if (entityIds.length > 0) {
      const firstEntity = states[entityIds[0]];

      // Render entity state in the card
      card.innerHTML = `
        <div class="card-header">
          <h3>${firstEntity.attributes?.friendly_name || entityIds[0]}</h3>
        </div>
        <div class="card-content">
          <span class="state">${firstEntity.state}</span>
        </div>
      `;

      // Test DOM manipulation
      const header = card.querySelector('.card-header h3');
      const stateElement = card.querySelector('.state');

      expect(header?.textContent).toContain(firstEntity.attributes?.friendly_name || entityIds[0]);
      expect(stateElement?.textContent).toBe(firstEntity.state);
      expect(document.body.contains(card)).toBe(true);

      console.log(`✅ Rendered card for ${entityIds[0]}: ${firstEntity.state}`);
    }

    // Cleanup
    document.body.removeChild(card);
  });

  it('should test custom element with entity data', () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    // Create a custom element
    const element = document.createElement('ha-entity-badge');

    // Find a light entity
    const states = hass?.states || {};
    const lightEntities = Object.keys(states).filter((id) => id.startsWith('light.'));

    if (lightEntities.length > 0) {
      const lightId = lightEntities[0];
      const light = states[lightId];

      element.setAttribute('entity', lightId);
      element.setAttribute('state', light.state);
      element.textContent = light.attributes?.friendly_name || lightId;

      document.body.appendChild(element);

      // Test element was created correctly
      expect(element.getAttribute('entity')).toBe(lightId);
      expect(element.getAttribute('state')).toBe(light.state);
      expect(element.textContent).toBeTruthy();

      console.log(`✅ Created badge for ${lightId}: ${light.state}`);

      // Cleanup
      document.body.removeChild(element);
    }
  });

  it('should test event handlers with HA service calls', async () => {
    if (hassMode === 'mock') {
      console.log('Skipping in mock mode');
      return;
    }

    // Create a button
    const button = document.createElement('button');
    button.textContent = 'Test Button';

    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });

    document.body.appendChild(button);

    // Simulate click
    button.click();
    expect(clicked).toBe(true);

    // Verify we can access HA services
    const services = hass?.services || {};
    expect(Object.keys(services).length).toBeGreaterThan(0);

    console.log('✅ Event handlers work with HA service access');

    // Cleanup
    document.body.removeChild(button);
  });

  it('should test window and document APIs', () => {
    // Test various DOM/Browser APIs are available
    expect(window.location).toBeDefined();
    expect(window.navigator).toBeDefined();
    expect(document.body).toBeDefined();
    expect(document.head).toBeDefined();
    expect(document.documentElement).toBeDefined();

    // Test DOM manipulation
    const div = document.createElement('div');
    div.id = 'test-div';
    div.className = 'test-class';

    document.body.appendChild(div);

    const found = document.getElementById('test-div');
    expect(found).toBe(div);

    const foundByClass = document.querySelector('.test-class');
    expect(foundByClass).toBe(div);

    document.body.removeChild(div);
  });
});
