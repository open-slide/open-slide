import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { findSlideSource, slideLocSelector } from './fiber.ts';

class FakeHTMLElement {
  dataset: Record<string, string> = {};
  private closestSelf: FakeHTMLElement | null = null;
  setClosestSelfForSlideLoc() {
    this.closestSelf = this;
  }
  closest(selector: string): FakeHTMLElement | null {
    if (selector === '[data-slide-loc]') return this.closestSelf;
    return null;
  }
}

type DebugSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
type FakeFiber = {
  return: FakeFiber | null;
  stateNode?: unknown;
  _debugSource?: DebugSource;
};

function makeEl(opts: { slideLoc?: string; fiber?: FakeFiber } = {}): FakeHTMLElement {
  const el = new FakeHTMLElement();
  if (opts.slideLoc) {
    el.dataset.slideLoc = opts.slideLoc;
    el.setClosestSelfForSlideLoc();
  }
  if (opts.fiber) {
    (el as unknown as Record<string, FakeFiber>).__reactFiber$test = opts.fiber;
  }
  return el;
}

function makeFiber(opts: {
  fileName?: string;
  line?: number;
  column?: number;
  host?: boolean;
  parent?: FakeFiber | null;
}): FakeFiber {
  const source: DebugSource | undefined =
    opts.fileName !== undefined
      ? { fileName: opts.fileName, lineNumber: opts.line, columnNumber: opts.column }
      : undefined;
  return {
    return: opts.parent ?? null,
    stateNode: opts.host ? new FakeHTMLElement() : undefined,
    _debugSource: source,
  };
}

beforeAll(() => {
  vi.stubGlobal('HTMLElement', FakeHTMLElement);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('findSlideSource primary path', () => {
  it('reads line:column from data-slide-loc', () => {
    const el = makeEl({ slideLoc: '42:7' });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(42);
    expect(hit?.column).toBe(7);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
    expect(hit?.file).toBe('index.tsx');
  });

  it('parses file line col and legacy form', () => {
    const tagged = findSlideSource(
      makeEl({ slideLoc: 'pages/03-team.tsx:8:5' }) as unknown as HTMLElement,
      'cover',
    );
    expect(tagged).toMatchObject({ file: 'pages/03-team.tsx', line: 8, column: 5 });
    const legacy = findSlideSource(makeEl({ slideLoc: '8:5' }) as unknown as HTMLElement, 'cover');
    expect(legacy).toMatchObject({ file: 'index.tsx', line: 8, column: 5 });
  });
});

describe('findSlideSource fallback', () => {
  it('matches a POSIX fileName', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 10,
      column: 4,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(10);
    expect(hit?.column).toBe(4);
    expect(hit?.file).toBe('index.tsx');
  });

  it('fiber fallback matches page file', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/cover/pages/03-team.tsx?t=1',
      line: 7,
      column: 2,
      host: true,
    });
    const hit = findSlideSource(makeEl({ fiber }) as unknown as HTMLElement, 'cover');
    expect(hit).toMatchObject({ file: 'pages/03-team.tsx', line: 7, column: 2 });
  });

  it('matches a Windows-backslash fileName', () => {
    const fiber = makeFiber({
      fileName: 'C:\\repo\\slides\\cover\\index.tsx',
      line: 11,
      column: 2,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(11);
    expect(hit?.column).toBe(2);
  });

  it('matches a fileName carrying an HMR ?t= query', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/cover/index.tsx?t=1700000000000',
      line: 12,
      column: 0,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(12);
  });

  it('matches a Windows fileName with an HMR query', () => {
    const fiber = makeFiber({
      fileName: 'C:\\repo\\slides\\cover\\index.tsx?t=1700000000000',
      line: 13,
      column: 1,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(13);
    expect(hit?.column).toBe(1);
  });

  it('returns null when the fiber fileName points at a different slideId', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/other/index.tsx',
      line: 10,
      column: 4,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).toBeNull();
  });

  it('walks up the fiber chain until it finds a matching source', () => {
    const parent = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 99,
      column: 3,
      host: true,
    });
    const leaf = makeFiber({ parent, host: true });
    const el = makeEl({ fiber: leaf });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(99);
    expect(hit?.column).toBe(3);
  });
});

describe('slideLocSelector', () => {
  it('escapes a double quote and a backslash in the file name', () => {
    expect(slideLocSelector({ file: 'pages/a"b\\c.tsx', line: 3, column: 4 })).toBe(
      '[data-slide-loc="pages/a\\"b\\\\c.tsx:3:4"]',
    );
  });
});
