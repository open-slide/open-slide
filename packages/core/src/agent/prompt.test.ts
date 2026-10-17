import { describe, expect, it } from 'vitest';
import { applyCommentsPrompt, buildTurnPrompt, createSlidePrompt } from './prompt.ts';

describe('buildTurnPrompt', () => {
  it('returns the text untouched without slide context', () => {
    expect(buildTurnPrompt('hello', undefined)).toBe('hello');
    expect(buildTurnPrompt('hello', {})).toBe('hello');
  });

  it('appends a context block describing slide, page and selection', () => {
    const out = buildTurnPrompt('make it bigger', {
      slideId: 'q2-roadmap',
      slideTitle: 'Q2 Roadmap',
      pageNumber: 3,
      totalPages: 8,
      pendingComments: 2,
      selection: { line: 42, column: 6, tagName: 'h1', text: 'Q2 Roadmap' },
    });
    expect(out.startsWith('make it bigger\n\n<open-slide-context>\n')).toBe(true);
    expect(out).toContain('slides/q2-roadmap/index.tsx');
    expect(out).toContain('page 3 of 8 (0-based index 2');
    expect(out).toContain(
      '<h1> element at slides/q2-roadmap/index.tsx:42:6 with text "Q2 Roadmap"',
    );
    expect(out).toContain('2 pending @slide-comment markers');
    expect(out.endsWith('</open-slide-context>')).toBe(true);
  });

  it('omits optional lines when absent', () => {
    const out = buildTurnPrompt('x', { slideId: 'deck', selection: null });
    expect(out).not.toContain('page ');
    expect(out).not.toContain('selected');
  });
});

describe('quick-action prompts', () => {
  it('names the skills explicitly', () => {
    expect(createSlidePrompt('  ')).toContain('create-slide skill');
    expect(createSlidePrompt('about Rust')).toBe(
      'Use the create-slide skill to draft a new deck. about Rust',
    );
    expect(applyCommentsPrompt('deck')).toContain('slides/deck/index.tsx');
  });
});
