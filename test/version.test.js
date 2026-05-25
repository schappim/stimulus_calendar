import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/lib/version.js';

describe('VERSION', () => {
  it('is a semver-shaped string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
