const path = require('path');

describe('ARLTR config', () => {
  let originalEnv;
  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('validateEnv throws when missing required env vars', () => {
    process.env.GRAPHHOPPER_API_KEY = '';
    const config = require('../config');
    expect(() => config.validateEnv()).toThrow(/Missing required environment variables/);
  });

  test('validateEnv passes when required env vars present', () => {
    process.env.GRAPHHOPPER_API_KEY = 'test-key';
    delete require.cache[require.resolve('../config')];
    const config = require('../config');
    expect(config.validateEnv()).toBe(true);
  });
});
