import { describe, expect, it } from 'vitest';
import { getThumbnailKeyTarget } from './thumbnail-rail-keys';

describe('getThumbnailKeyTarget', () => {
  it('moves to the next page with ArrowDown and ArrowRight', () => {
    expect(getThumbnailKeyTarget('ArrowDown', 0, 4)).toBe(1);
    expect(getThumbnailKeyTarget('ArrowRight', 2, 4)).toBe(3);
  });

  it('moves to the previous page with ArrowUp and ArrowLeft', () => {
    expect(getThumbnailKeyTarget('ArrowUp', 3, 4)).toBe(2);
    expect(getThumbnailKeyTarget('ArrowLeft', 1, 4)).toBe(0);
  });

  it('jumps to the first and last page with Home and End', () => {
    expect(getThumbnailKeyTarget('Home', 2, 4)).toBe(0);
    expect(getThumbnailKeyTarget('End', 1, 4)).toBe(3);
  });

  it('stops at the edges of the deck', () => {
    expect(getThumbnailKeyTarget('ArrowUp', 0, 4)).toBeNull();
    expect(getThumbnailKeyTarget('ArrowDown', 3, 4)).toBeNull();
    expect(getThumbnailKeyTarget('Home', 0, 4)).toBeNull();
    expect(getThumbnailKeyTarget('End', 3, 4)).toBeNull();
  });

  it('ignores keys that do not navigate', () => {
    expect(getThumbnailKeyTarget('Enter', 1, 4)).toBeNull();
    expect(getThumbnailKeyTarget(' ', 1, 4)).toBeNull();
    expect(getThumbnailKeyTarget('a', 1, 4)).toBeNull();
  });

  it('ignores an empty deck', () => {
    expect(getThumbnailKeyTarget('ArrowDown', 0, 0)).toBeNull();
  });
});
