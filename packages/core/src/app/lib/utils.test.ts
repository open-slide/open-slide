import { describe, expect, it } from 'vitest';
import { cn, formatClock, pad2, round2 } from './utils.ts';

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b');
  });

  it('flattens arrays and conditional objects from clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });

  it('lets later tailwind classes override earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('preserves classes that target different properties', () => {
    expect(cn('p-2', 'm-4')).toBe('p-2 m-4');
  });
});

describe('pad2', () => {
  it('pads single digits to two', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
  });

  it('leaves two or more digits alone', () => {
    expect(pad2(12)).toBe('12');
    expect(pad2(340)).toBe('340');
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.005)).toBe(1);
    expect(round2(1.2345)).toBe(1.23);
    expect(round2(1.2355)).toBe(1.24);
  });

  it('leaves whole numbers alone', () => {
    expect(round2(42)).toBe(42);
  });
});

describe('formatClock', () => {
  it('formats minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3599)).toBe('59:59');
  });

  it('adds an hour digit past sixty minutes', () => {
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3661.9)).toBe('1:01:01');
  });

  it('clamps negatives to zero', () => {
    expect(formatClock(-5)).toBe('00:00');
  });
});
