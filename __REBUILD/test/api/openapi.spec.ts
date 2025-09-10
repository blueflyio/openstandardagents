import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('OpenAPI Spec', () => {
  const base = __dirname.replace(/\\|
/g,'');
  const specPath = join(base, '..', '..', 'openapi.yml');
  it('exists', () => { expect(existsSync(specPath)).toBe(true); });
  it('has required sections', () => {
    const txt = readFileSync(specPath,'utf8');
    expect(/openapi:\s*3\.1/.test(txt)).toBe(true);
    expect(/info:\n/.test(txt)).toBe(true);
    expect(/servers:\n/.test(txt)).toBe(true);
    expect(/components:\n/.test(txt)).toBe(true);
  });
  it('defines RFC7807 Problem', () => {
    const txt = readFileSync(specPath,'utf8');
    expect(/schemas:\n[\s\S]*Problem:/.test(txt)).toBe(true);
  });
});
