import { describe, expect, it } from 'vitest';
import {
  buildFixPrompt,
  cleanDevUrls,
  describeLoadError,
  describeRenderError,
  formatLocation,
  fromViteError,
  isImportFailure,
  parseViteErrorPage,
} from './slide-errors';

describe('cleanDevUrls', () => {
  it('turns Vite @fs URLs into filesystem paths and drops cache-busting params', () => {
    expect(
      cleanDevUrls(
        'at Cover (http://localhost:5173/@fs/Users/me/deck/slides/intro/index.tsx?t=1731700000000:12:7)',
      ),
    ).toBe('at Cover (/Users/me/deck/slides/intro/index.tsx:12:7)');
  });

  it('handles a non-root base path', () => {
    expect(cleanDevUrls('http://127.0.0.1:4000/docs/@fs/srv/slides/a/index.tsx')).toBe(
      '/srv/slides/a/index.tsx',
    );
  });
});

describe('isImportFailure', () => {
  it.each([
    'Failed to fetch dynamically imported module: http://localhost:5173/@fs/x/index.tsx?t=0',
    'Importing a module script failed.',
    'error loading dynamically imported module: http://localhost:5173/@fs/x/index.tsx',
  ])('recognizes %s', (message) => {
    expect(isImportFailure(new TypeError(message))).toBe(true);
  });

  it('ignores errors thrown by the module itself', () => {
    expect(isImportFailure(new Error('data is undefined'))).toBe(false);
    expect(isImportFailure('Failed to fetch dynamically imported module')).toBe(false);
  });
});

describe('parseViteErrorPage', () => {
  it('extracts the error payload from the dev server 500 page', () => {
    const payload = {
      message: 'Unexpected token',
      id: '/Users/me/deck/slides/intro/index.tsx',
      frame: '1 | export default [\n  |                ^',
      loc: { file: '/Users/me/deck/slides/intro/index.tsx', line: 1, column: 16 },
    };
    const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <script type="module">
              const error = ${JSON.stringify(payload).replace(/</g, '\\u003c')}
              try {`;
    expect(parseViteErrorPage(html)).toEqual(payload);
  });

  it('returns null for anything else', () => {
    expect(parseViteErrorPage('<html>Internal Server Error</html>')).toBeNull();
  });
});

describe('fromViteError', () => {
  it('prefers the location file and keeps the code frame', () => {
    expect(
      fromViteError({
        message: '  Expected "}" but found ")"  ',
        id: '/deck/slides/a/index.tsx',
        frame: '  3 |   return <div>)\n',
        loc: { file: '/deck/slides/a/parts.tsx', line: 3, column: 15 },
      }),
    ).toEqual({
      kind: 'compile',
      message: 'Expected "}" but found ")"',
      file: '/deck/slides/a/parts.tsx',
      loc: { line: 3, column: 15 },
      frame: '3 |   return <div>)',
      stack: undefined,
    });
  });
});

describe('fromViteError with an Oxc parse error', () => {
  it('reads the position from the framed message and drops the cache-buster', () => {
    const info = fromViteError({
      message:
        'Transform failed with 1 error:\n\n[PARSE_ERROR] Expected `>` but found `<`\n   ╭─[ slides/intro/index.tsx?t=0:9:3 ]\n 9 │   </div>',
      id: '/Users/me/deck/slides/intro/index.tsx?t=1731700000000',
    });
    expect(info.message.startsWith('[PARSE_ERROR]')).toBe(true);
    expect(info.message).toContain('[ slides/intro/index.tsx:9:3 ]');
    expect(info.file).toBe('/Users/me/deck/slides/intro/index.tsx');
    expect(info.loc).toEqual({ line: 9, column: 3 });
  });
});

describe('formatLocation', () => {
  it('shortens the path to start at the slides dir', () => {
    const info = fromViteError({
      message: 'x',
      loc: { file: '/Users/me/deck/slides/intro/index.tsx', line: 2, column: 4 },
    });
    expect(formatLocation(info, 'slides')).toBe('slides/intro/index.tsx:2:4');
    expect(formatLocation(info)).toBe('/Users/me/deck/slides/intro/index.tsx:2:4');
  });
});

describe('describeLoadError', () => {
  it('keeps the message and stack of an error thrown while the module evaluates', async () => {
    const err = new Error('boom');
    const info = await describeLoadError(err, Date.now());
    expect(info.kind).toBe('module');
    expect(info.message).toBe('boom');
    expect(info.stack).toContain('boom');
  });

  it('reports an unknown slide id as missing rather than a module crash', async () => {
    const info = await describeLoadError(new Error('Slide not found: nope'), Date.now());
    expect(info).toEqual({ kind: 'missing', message: 'Slide not found: nope' });
  });
});

describe('buildFixPrompt', () => {
  it('describes a compile error with its location and frame', () => {
    const prompt = buildFixPrompt(
      {
        kind: 'compile',
        message: 'Unexpected token',
        file: '/deck/slides/intro/index.tsx',
        loc: { line: 4, column: 2 },
        frame: '4 | <div',
        stack: 'should not be included',
      },
      { slideId: 'intro' },
    );
    expect(prompt).toContain('`slides/intro/` fails to compile');
    expect(prompt).toContain('Error: Unexpected token');
    expect(prompt).toContain('File: /deck/slides/intro/index.tsx:4:2');
    expect(prompt).toContain('```\n4 | <div\n```');
    expect(prompt).not.toContain('should not be included');
  });

  it('names the page and includes stacks for render errors', () => {
    const info = describeRenderError(
      new TypeError('items.map is not a function'),
      '\n    at Agenda',
    );
    const prompt = buildFixPrompt(info, { slideId: 'q3', slidesDir: 'decks', pageNumber: 3 });
    expect(prompt).toContain('`decks/q3/` throws while rendering page 3');
    expect(prompt).toContain('Error: items.map is not a function');
    expect(prompt).toContain('Stack:');
    expect(prompt).toContain('Component stack:\n```\nat Agenda\n```');
  });
});
