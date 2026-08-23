import { countries } from './country-list';

describe('country-list', () => {
  it('includes every country, not a short curated list', () => {
    expect(countries.length).toBeGreaterThan(150);
  });

  it('gives every entry a code and a human-readable name', () => {
    for (const country of countries) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate codes', () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('includes the United States with its human-readable name', () => {
    expect(countries.find((c) => c.code === 'US')?.name).toBe('United States');
  });

  it('is sorted alphabetically by name', () => {
    const names = countries.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
