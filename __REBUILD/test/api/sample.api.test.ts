import fs from 'fs';

describe('OpenAPI exists', () => {
  it('has openapi.yml', () => {
    expect(fs.existsSync(require('path').join(__dirname, '..', '..', 'openapi.yml'))).toBe(true);
  });
});
