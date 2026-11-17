import { describe, expect, it } from 'vitest';
import { moveTab, recencyOrder } from './tab-order';

const tabs = ['H', 'A', 'B', 'C', 'D'];

describe('moveTab', () => {
  it('drops a tab dragged right into the gap it was released on', () => {
    expect(moveTab(tabs, 1, 3)).toEqual(['H', 'B', 'A', 'C', 'D']);
    expect(moveTab(tabs, 1, 5)).toEqual(['H', 'B', 'C', 'D', 'A']);
  });

  it('drops a tab dragged left into the gap it was released on', () => {
    expect(moveTab(tabs, 3, 1)).toEqual(['H', 'C', 'A', 'B', 'D']);
    expect(moveTab(tabs, 4, 2)).toEqual(['H', 'A', 'D', 'B', 'C']);
  });

  it('leaves the order alone when released next to itself', () => {
    expect(moveTab(tabs, 2, 2)).toEqual(tabs);
    expect(moveTab(tabs, 2, 3)).toEqual(tabs);
  });

  it('never moves Home or places a tab before it', () => {
    expect(moveTab(tabs, 0, 3)).toEqual(tabs);
    expect(moveTab(tabs, 3, 0)).toEqual(['H', 'C', 'A', 'B', 'D']);
    expect(moveTab(tabs, 3, -4)).toEqual(['H', 'C', 'A', 'B', 'D']);
  });

  it('ignores an index that is not an integer', () => {
    expect(moveTab(tabs, 2, Number.NaN)).toEqual(tabs);
    expect(moveTab(tabs, 2, 'x' as unknown as number)).toEqual(tabs);
  });
});

describe('recencyOrder', () => {
  it('puts the most recently used tabs first', () => {
    expect(recencyOrder(tabs, ['C', 'A', 'H'])).toEqual(['C', 'A', 'H', 'B', 'D']);
  });

  it('skips tabs that have closed and ones listed twice', () => {
    expect(recencyOrder(tabs, ['C', 'X', 'C', 'B'])).toEqual(['C', 'B', 'H', 'A', 'D']);
  });
});
