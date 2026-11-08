import { describe, expect, it } from 'vitest';
import { SHAPE_KINDS } from '../lib/structure.ts';
import { shapePath } from './shape.tsx';

describe('shapePath', () => {
  it('draws every non-CSS kind inside its box', () => {
    for (const kind of SHAPE_KINDS) {
      const path = shapePath(kind, 200, 100);
      if (kind === 'rect' || kind === 'ellipse') {
        expect(path).toBeNull();
        continue;
      }
      expect(path).toBeTruthy();
      const numbers = (path ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(200);
    }
  });

  it('closes polygons', () => {
    expect(shapePath('triangle', 100, 100)).toBe('M50,0 L100,100 L0,100 Z');
  });
});
