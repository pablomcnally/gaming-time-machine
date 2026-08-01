import { describe, expect, it } from 'vitest';
import { hashSeed, SeededRandom } from './seeded';

describe('SeededRandom', () => {
  it('recreates the same sequence from the same seed', () => {
    const first = new SeededRandom('DR-TEST-SEQUENCE');
    const second = new SeededRandom('DR-TEST-SEQUENCE');
    const firstSequence = Array.from({ length: 100 }, () => first.next());
    const secondSequence = Array.from({ length: 100 }, () => second.next());
    expect(firstSequence).toEqual(secondSequence);
  });

  it('produces distinct sequences for distinct seeds', () => {
    const first = new SeededRandom('DR-A');
    const second = new SeededRandom('DR-B');
    expect(Array.from({ length: 12 }, () => first.next())).not.toEqual(
      Array.from({ length: 12 }, () => second.next()),
    );
    expect(hashSeed('DR-A')).not.toBe(hashSeed('DR-B'));
  });

  it('never leaves its documented ranges', () => {
    const random = new SeededRandom('DR-BOUNDS');
    for (let index = 0; index < 10_000; index += 1) {
      expect(random.next()).toBeGreaterThanOrEqual(0);
      expect(random.next()).toBeLessThan(1);
      expect(random.signed()).toBeGreaterThanOrEqual(-1);
      expect(random.signed()).toBeLessThanOrEqual(1);
    }
  });
});
