import { describe, it, expect } from 'vitest';
import { calculateStars } from '@/components/GameRunner';

describe('calculateStars', () => {
  it('returns 3 for perfect score (1.0, 0.6)', () => {
    expect(calculateStars(1.0, 0.6)).toBe(3);
  });

  it('returns 2 for 0.9 with 0.6 threshold', () => {
    expect(calculateStars(0.9, 0.6)).toBe(2);
  });

  it('returns 1 for passed but not great (0.8, 0.6)', () => {
    expect(calculateStars(0.8, 0.6)).toBe(1);
  });

  it('returns 0 for failed below threshold (0.5, 0.6)', () => {
    expect(calculateStars(0.5, 0.6)).toBe(0);
  });

  it('returns 0 when failed with high threshold (0.91, 0.95)', () => {
    expect(calculateStars(0.91, 0.95)).toBe(0);
  });

  it('returns 2 when barely passed (0.95, 0.95) — 0.95 >= 0.9 threshold', () => {
    expect(calculateStars(0.95, 0.95)).toBe(2);
  });
});
