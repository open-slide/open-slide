import { describe, expect, it } from 'vitest';
import {
  createPageTimes,
  foldPageTime,
  pageBudget,
  pageElapsedMs,
  scheduleDeltaMs,
} from './page-timer.ts';

describe('page timer', () => {
  it('counts time on the current page from when it was entered', () => {
    const times = createPageTimes(1000);
    expect(pageElapsedMs(times, 0, 4000)).toBe(3000);
    expect(pageElapsedMs(times, 1, 4000)).toBe(3000);
  });

  it('banks the outgoing page and restarts the clock on navigation', () => {
    let times = createPageTimes(1000);
    times = foldPageTime(times, 0, 4000);
    expect(times.elapsed[0]).toBe(3000);
    expect(times.enteredAt).toBe(4000);
    expect(pageElapsedMs(times, 1, 6500)).toBe(2500);
  });

  it('resumes a page where it left off when returning to it', () => {
    let times = createPageTimes(0);
    times = foldPageTime(times, 0, 3000);
    times = foldPageTime(times, 1, 5000);
    expect(pageElapsedMs(times, 0, 6000)).toBe(4000);
    expect(pageElapsedMs(times, 1, 6000)).toBe(3000);
  });

  it('does not mutate the previous snapshot', () => {
    const before = createPageTimes(0);
    const after = foldPageTime(before, 0, 1000);
    expect(before.elapsed).toEqual([]);
    expect(after).not.toBe(before);
  });

  it('ignores clock skew that would go backwards', () => {
    const times = foldPageTime(createPageTimes(5000), 0, 4000);
    expect(times.elapsed[0]).toBe(0);
    expect(pageElapsedMs(times, 0, 3000)).toBe(0);
  });
});

describe('scheduleDeltaMs', () => {
  const budgets = [10, undefined, 20, 30];

  it('stays level while the current page is within budget', () => {
    const times = createPageTimes(0);
    expect(scheduleDeltaMs(times, budgets, 0, 4000)).toBe(0);
    expect(scheduleDeltaMs(times, budgets, 0, 10_000)).toBe(0);
  });

  it('falls behind once the current page overruns', () => {
    const times = createPageTimes(0);
    expect(scheduleDeltaMs(times, budgets, 0, 13_000)).toBe(-3000);
  });

  it('gets ahead when a page is left early', () => {
    const times = foldPageTime(createPageTimes(0), 0, 6000);
    expect(scheduleDeltaMs(times, budgets, 2, 6000)).toBe(4000);
  });

  it('ignores time spent on pages without a budget', () => {
    let times = foldPageTime(createPageTimes(0), 0, 10_000);
    times = foldPageTime(times, 1, 60_000);
    expect(scheduleDeltaMs(times, budgets, 2, 60_000)).toBe(0);
  });

  it('counts pages skipped from a shown page as saved time', () => {
    const times = foldPageTime(createPageTimes(0), 0, 10_000);
    expect(scheduleDeltaMs(times, budgets, 3, 10_000)).toBe(20_000);
  });

  it('does not credit pages before the first page ever shown', () => {
    const times = createPageTimes(0);
    expect(scheduleDeltaMs(times, budgets, 3, 0)).toBe(0);
    expect(scheduleDeltaMs(times, budgets, 3, 5000)).toBe(0);
    expect(scheduleDeltaMs(times, budgets, 3, 31_000)).toBe(-1000);
  });

  it('ignores invalid budgets', () => {
    const times = foldPageTime(createPageTimes(0), 0, 10_000);
    expect(scheduleDeltaMs(times, [Number.NaN, -5, 0], 2, 10_000)).toBe(0);
  });

  it('leaves the delta alone on a detour back to an earlier page', () => {
    let times = foldPageTime(createPageTimes(0), 0, 10_000);
    times = foldPageTime(times, 2, 30_000);
    times = foldPageTime(times, 3, 45_000);
    const before = scheduleDeltaMs(times, budgets, 3, 45_000);
    const back = foldPageTime(times, 3, 45_000);
    expect(scheduleDeltaMs(back, budgets, 2, 45_000)).toBe(before);
    expect(scheduleDeltaMs(back, budgets, 2, 50_000)).toBe(before - 5000);
  });
});

describe('pageBudget', () => {
  it('returns positive finite seconds', () => {
    expect(pageBudget([30, 0.5], 0)).toBe(30);
    expect(pageBudget([30, 0.5], 1)).toBe(0.5);
  });

  it('treats missing, non-finite, zero and negative entries as no budget', () => {
    expect(pageBudget(undefined, 0)).toBeUndefined();
    expect(pageBudget([undefined], 0)).toBeUndefined();
    expect(pageBudget([30], 5)).toBeUndefined();
    expect(pageBudget([Number.NaN, Number.POSITIVE_INFINITY, 0, -5], 0)).toBeUndefined();
    expect(pageBudget([Number.NaN, Number.POSITIVE_INFINITY, 0, -5], 1)).toBeUndefined();
    expect(pageBudget([Number.NaN, Number.POSITIVE_INFINITY, 0, -5], 2)).toBeUndefined();
    expect(pageBudget([Number.NaN, Number.POSITIVE_INFINITY, 0, -5], 3)).toBeUndefined();
    expect(pageBudget(['30' as unknown as number], 0)).toBeUndefined();
  });
});
