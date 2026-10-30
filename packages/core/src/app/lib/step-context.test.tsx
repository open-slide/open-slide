import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Step } from './step-context';

describe('Step', () => {
  it('forwards data attributes to the wrapper', () => {
    const html = renderToStaticMarkup(
      <Step data-os-anim="fly" duration={240}>
        x
      </Step>,
    );
    expect(html).toContain('data-os-anim="fly"');
    expect(html).toContain('data-osd-step-duration="240"');
    expect(html).toContain('data-osd-step="revealed"');
  });

  it('defaults the exported duration to 180', () => {
    expect(renderToStaticMarkup(<Step>x</Step>)).toContain('data-osd-step-duration="180"');
  });

  it('keeps the internal step markers authoritative', () => {
    const html = renderToStaticMarkup(
      <Step data-osd-step="pending" data-osd-step-duration={999}>
        x
      </Step>,
    );
    expect(html).not.toContain('data-osd-step="pending"');
    expect(html).toContain('data-osd-step="revealed"');
    expect(html).not.toContain('data-osd-step-duration="999"');
    expect(html).toContain('data-osd-step-duration="180"');
  });
});
