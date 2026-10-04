export type PageTimes = {
  // Milliseconds accumulated on each page while it was not the current one.
  elapsed: number[];
  // Epoch ms when the current page became active.
  enteredAt: number;
};

export function createPageTimes(now: number): PageTimes {
  return { elapsed: [], enteredAt: now };
}

export function foldPageTime(times: PageTimes, fromIndex: number, now: number): PageTimes {
  const elapsed = times.elapsed.slice();
  elapsed[fromIndex] = (elapsed[fromIndex] ?? 0) + Math.max(0, now - times.enteredAt);
  return { elapsed, enteredAt: now };
}

export function pageElapsedMs(times: PageTimes, index: number, now: number): number {
  return (times.elapsed[index] ?? 0) + Math.max(0, now - times.enteredAt);
}

// Slide modules are user code, so a budget is only trusted when it is a
// positive finite number of seconds.
export function pageBudget(
  durations: (number | undefined)[] | undefined,
  index: number,
): number | undefined {
  const budget = durations?.[index];
  return typeof budget === 'number' && Number.isFinite(budget) && budget > 0 ? budget : undefined;
}

// Planned minus actual, in ms. Positive means ahead of schedule. Only
// budgeted pages count, and the plan starts at the first page ever shown so
// a deck opened mid-way is not credited for the pages before it. From there,
// pages before the current one are done (leaving early or skipping counts
// as saved time); the current page and any later page visited on a detour
// are in progress, so only their overrun counts against you.
export function scheduleDeltaMs(
  times: PageTimes,
  durations: (number | undefined)[],
  index: number,
  now: number,
): number {
  let start = index;
  for (let i = 0; i < index; i++) {
    if ((times.elapsed[i] ?? 0) > 0) {
      start = i;
      break;
    }
  }
  let planned = 0;
  let actual = 0;
  for (let i = start; i < durations.length; i++) {
    const budget = pageBudget(durations, i);
    if (budget === undefined) continue;
    const spent = i === index ? pageElapsedMs(times, i, now) : (times.elapsed[i] ?? 0);
    planned += i < index ? budget * 1000 : Math.min(spent, budget * 1000);
    actual += spent;
  }
  return planned - actual;
}
