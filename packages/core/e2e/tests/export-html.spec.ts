import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, expect, type Page, type TestInfo, test } from '@playwright/test';
import { unzipSync } from 'fflate';
import {
  deleteSlide,
  duplicateSlide,
  openSlide,
  prepareScratchProject,
  refreshSlidesModule,
  runCli,
  slideSourcePath,
  startCliServer,
  stopServer,
  TINY_PNG,
  waitForHttpOk,
} from './helpers.ts';

const MOTION_ID = 'html-export-motion';
const COUNTER_ID = 'html-export-static-counter';
const COUNTER_FALSE_ID = 'html-export-static-counter-false';
const COUNTER_SOURCE = `import { useLayoutEffect, useState } from 'react';
import { type Page, useIsActivePage } from '@open-slide/core';

const Counter: Page = () => {
  const active = useIsActivePage();
  const [value, setValue] = useState(42);
  useLayoutEffect(() => {
    if (!active) { setValue(42); return; }
    setValue(0);
    // The snapshot must not freeze this transient value into an offline file.
    const timer = setTimeout(() => setValue(42), 10_000);
    return () => clearTimeout(timer);
  }, [active]);
  return <div data-static-counter data-entry-active={String(active)}>{value}</div>;
};
export const transition = {
  duration: 500,
  enter: { duration: 500, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
} satisfies NonNullable<Page['transition']>;
export default [Counter, Counter] satisfies Page[];
`;
const SOURCE = `import {
  type Page, type SlideMeta, Step, Steps, useIsActivePage, useSlidePageNumber,
} from '@open-slide/core';
import badge from './badge.png';
import './entry.css';

export const meta: SlideMeta = {
  title: 'HTML Motion Regression', createdAt: '2026-09-30T00:00:00.000Z',
};
export const htmlExport = { activePage: true };
export const transition = {
  duration: 500,
  exit: { duration: 400, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: {
    duration: 500, delay: 35, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateX(calc(var(--osd-dir, 1) * 12px))' },
      { opacity: 1, transform: 'translateX(0px)' },
    ],
  },
} satisfies NonNullable<Page['transition']>;

function Content({ label, steps = true }: { label: string; steps?: boolean }) {
  const active = useIsActivePage();
  const { current, total } = useSlidePageNumber();
  return (
    <div className={active ? 'motion-page active' : 'motion-page'}
      data-entry-active={String(active)} data-page-number={current} data-page-total={total}>
      <img src={badge} alt="Bundled badge" width={20} height={20} />
      <h1>{label}</h1>
      <p data-css-entry>CSS entrance</p>
      {steps && <Steps><Step><p>First detail</p></Step><Step><p>Second detail</p></Step></Steps>}
    </div>
  );
}
const One: Page = () => <Content label="Motion page one" />;
const Two: Page = () => <Content label="Motion page two" />;
const Three: Page = () => <Content label="Motion page three" steps={false} />;
Two.transition = {
  duration: 700, throughBackground: true,
  exit: { duration: 450, keyframes: { opacity: [1, 0] } },
  enter: {
    duration: 700, delay: 55, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateX(calc(var(--osd-dir, 1) * 24px))',
        content: '</script><script>window.__htmlExportInjected = true</script>' },
      { opacity: 1, transform: 'translateX(0px)' },
    ],
  },
};
export default [One, Two, Three] satisfies Page[];
`;

const CSS = `@keyframes html-export-entry {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.motion-page { width: 100%; height: 100%; background: #101828; color: #f9fafb;
  padding: 120px; box-sizing: border-box; font: 44px system-ui, sans-serif; }
.motion-page h1 { font-size: 88px; }
.motion-page [data-css-entry] { opacity: 0; }
.motion-page.active [data-css-entry] { animation: html-export-entry 260ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .motion-page.active [data-css-entry] { animation: none; opacity: 1; transform: none; }
}
`;

async function writeMotionSlide(dir: string) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.tsx'), SOURCE);
  await fs.writeFile(path.join(dir, 'entry.css'), CSS);
  await fs.writeFile(path.join(dir, 'badge.png'), TINY_PNG);
}

async function downloadHtml(page: Page, slideId: string, info: TestInfo): Promise<string> {
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Export as HTML', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(new RegExp(`^${slideId}\\.(html|zip)$`));
  const outputDir = info.outputPath('download');
  await fs.mkdir(outputDir, { recursive: true });
  const htmlPath = path.join(outputDir, `${slideId}.html`);
  if (download.suggestedFilename().endsWith('.html')) {
    await download.saveAs(htmlPath);
  } else {
    const archivePath = info.outputPath(`${slideId}.zip`);
    await download.saveAs(archivePath);
    const archive = unzipSync(new Uint8Array(await fs.readFile(archivePath)));
    expect(archive[`${slideId}.html`]).toBeDefined();
    for (const [name, bytes] of Object.entries(archive)) {
      if (name.endsWith('/')) continue;
      const file = path.resolve(outputDir, name);
      expect(file.startsWith(`${outputDir}${path.sep}`)).toBe(true);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, bytes);
    }
  }
  return htmlPath;
}

async function openOffline(page: Page, context: BrowserContext, file: string) {
  await context.setOffline(true);
  await page.goto(pathToFileURL(file).href);
  await expect(page.locator('.os-page:not([hidden])')).toHaveCount(1);
}

async function exportMotion(page: Page, context: BrowserContext, info: TestInfo) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openSlide(page, MOTION_ID);
  const file = await downloadHtml(page, MOTION_ID, info);
  await openOffline(page, context, file);
  return file;
}

async function nativeAnimations(page: Page) {
  return page.evaluate(() =>
    document.getAnimations().flatMap((animation) => {
      const effect = animation.effect;
      if (!(effect instanceof KeyframeEffect)) return [];
      const target = effect.target;
      if (!(target instanceof HTMLElement) || !target.matches('.os-page')) return [];
      const timing = effect.getTiming();
      return [{ index: target.dataset.idx, ...timing, keyframes: effect.getKeyframes() }];
    }),
  );
}

async function settled(page: Page, current: string) {
  await expect(page.locator('#os-cur')).toHaveText(current);
  await expect.poll(() => nativeAnimations(page)).toHaveLength(0);
  await expect(page.locator('.os-page:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.os-page:not([inert])')).toHaveCount(1);
  await expect(page.locator('.os-page[aria-hidden="false"]')).toHaveCount(1);
}

test.describe('standalone HTML motion', () => {
  test.beforeAll(async ({ request }) => {
    await duplicateSlide(request, 'alpha', MOTION_ID);
    await writeMotionSlide(path.dirname(slideSourcePath(MOTION_ID)));
    await refreshSlidesModule(MOTION_ID);
    for (const id of [COUNTER_ID, COUNTER_FALSE_ID]) {
      await duplicateSlide(request, 'alpha', id);
      await fs.writeFile(
        slideSourcePath(id),
        COUNTER_SOURCE +
          (id === COUNTER_FALSE_ID ? '\nexport const htmlExport = { activePage: false };' : ''),
      );
      await refreshSlidesModule(id);
    }
  });

  test.afterAll(async ({ request }) => {
    await deleteSlide(request, MOTION_ID);
    await deleteSlide(request, COUNTER_ID);
    await deleteSlide(request, COUNTER_FALSE_ID);
  });

  for (const id of [COUNTER_ID, COUNTER_FALSE_ID]) {
    test(`preserves final data and page transitions with static capture (${id})`, async ({
      page,
      context,
    }, info) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await openSlide(page, id);
      const file = await downloadHtml(page, id, info);
      await openOffline(page, context, file);
      await expect(page.locator('[data-static-counter]')).toHaveText(['42', '42']);
      await expect(page.locator('[data-entry-active="false"]')).toHaveCount(2);
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => nativeAnimations(page)).toHaveLength(1);
      await settled(page, '2');
      await expect(page.locator('.os-page:not([hidden]) [data-static-counter]')).toHaveText('42');
    });
  }

  test('captures active CSS, safe transition data and packaged assets in an offline file', async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const file = await exportMotion(page, context, info);
    const html = await fs.readFile(file, 'utf8');
    expect(html).toContain('\\u003c/script>\\u003cscript>window.__htmlExportInjected');
    expect(html).not.toContain('</script><script>window.__htmlExportInjected = true</script>');
    await expect(page.locator('[data-entry-active="true"]')).toHaveCount(3);
    await expect(page.locator('[data-page-number="1"]')).toHaveAttribute('data-page-total', '3');
    await expect(page.locator('.os-page:not([hidden]) [data-css-entry]')).toHaveCSS('opacity', '1');
    expect(await page.locator('script').count()).toBe(2);
    expect(await page.evaluate(() => Reflect.get(window, '__htmlExportInjected'))).toBeUndefined();
    await expect
      .poll(() =>
        page
          .locator('img')
          .evaluateAll((images) =>
            images.every((img) => img instanceof HTMLImageElement && img.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="pending"]')).toHaveCount(2);
    await page.screenshot({ path: info.outputPath('offline-first-page.png') });
    expect(errors).toEqual([]);
  });

  test('uses incoming overrides, direction and v2 outgoing opacity semantics', async ({
    page,
    context,
  }, info) => {
    await exportMotion(page, context, info);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => nativeAnimations(page)).toHaveLength(2);
    const forward = await nativeAnimations(page);
    expect(forward.find((a) => a.index === '1')).toMatchObject({
      duration: 700,
      delay: 55,
      easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
      fill: 'both',
    });
    expect(forward.find((a) => a.index === '0')?.keyframes.at(-1)?.opacity).toBe('0');
    await expect(page.locator('#os-frame')).toHaveAttribute('data-osd-dir', 'forward');
    await expect(page.locator('#os-frame')).toHaveCSS('--osd-dir', '1');
    await settled(page, '2');

    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => nativeAnimations(page)).toHaveLength(2);
    const backward = await nativeAnimations(page);
    expect(backward.find((a) => a.index === '0')).toMatchObject({ duration: 500, delay: 35 });
    expect(
      backward.find((a) => a.index === '1')?.keyframes.every((k) => k.opacity === undefined),
    ).toBe(true);
    await expect(page.locator('#os-frame')).toHaveAttribute('data-osd-dir', 'backward');
    await expect(page.locator('#os-frame')).toHaveCSS('--osd-dir', '-1');
    await settled(page, '1');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="revealed"]')).toHaveCount(2);
  });

  test('replays CSS entrances on forward and backward visits', async ({ page, context }, info) => {
    await exportMotion(page, context, info);
    await page.evaluate(() => {
      Reflect.set(window, 'entryStarts', 0);
      document.addEventListener('animationstart', (event) => {
        if (event.animationName === 'html-export-entry') {
          Reflect.set(window, 'entryStarts', Number(Reflect.get(window, 'entryStarts')) + 1);
        }
      });
    });
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await settled(page, '2');
    const starts = await page.evaluate(() => Number(Reflect.get(window, 'entryStarts')));
    expect(starts).toBeGreaterThanOrEqual(1);
    await page.keyboard.press('ArrowLeft');
    await settled(page, '1');
    await expect
      .poll(() => page.evaluate(() => Number(Reflect.get(window, 'entryStarts'))))
      .toBeGreaterThan(starts);
  });

  test('keeps stepwise navigation correct while page animations are interrupted', async ({
    page,
    context,
  }, info) => {
    await exportMotion(page, context, info);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#os-cur')).toHaveText('2');
    await expect(page.locator('.os-page[data-idx="1"] [data-osd-step="revealed"]')).toHaveCount(2);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await settled(page, '2');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="revealed"]')).toHaveCount(2);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#os-cur')).toHaveText('2');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="revealed"]')).toHaveCount(1);
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    await settled(page, '1');
  });

  test('does not animate boundary no-ops and responds to reduced motion changes', async ({
    page,
    context,
  }, info) => {
    await exportMotion(page, context, info);
    await page.keyboard.press('ArrowLeft');
    expect(await nativeAnimations(page)).toHaveLength(0);
    await page.keyboard.press('End');
    await settled(page, '3');
    await page.keyboard.press('ArrowRight');
    expect(await nativeAnimations(page)).toHaveLength(0);
    await page.keyboard.press('Home');
    await expect.poll(() => nativeAnimations(page)).toHaveLength(2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settled(page, '1');
    await expect(page.locator('.os-page:not([hidden]) [data-css-entry]')).toHaveCSS(
      'animation-name',
      'none',
    );
    await page.keyboard.press('ArrowRight');
    await settled(page, '2');
    await expect(page.locator('.os-page:not([hidden]) [data-css-entry]')).toHaveCSS('opacity', '1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.keyboard.press('Home');
    await expect.poll(() => nativeAnimations(page)).toHaveLength(2);
    await settled(page, '1');
  });

  test('preserves v2 step navigation for decks without page transitions', async ({
    page,
    context,
  }, info) => {
    await openSlide(page, 'steps');
    const file = await downloadHtml(page, 'steps', info);
    await openOffline(page, context, file);
    await page.keyboard.press('ArrowRight');
    await settled(page, '2');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="pending"]')).toHaveCount(2);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Step item first', { exact: true })).toBeVisible();
    await expect(page.getByText('Step item second', { exact: true })).toBeHidden();
    await expect(page.locator('#os-cur')).toHaveText('2');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Step item second', { exact: true })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await settled(page, '3');
    await page.keyboard.press('ArrowLeft');
    await settled(page, '2');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="revealed"]')).toHaveCount(2);
  });

  test('exports a playable offline deck from a production build', async ({
    page,
    context,
  }, info) => {
    test.setTimeout(120_000);
    const project = prepareScratchProject('html-motion-production');
    await writeMotionSlide(path.join(project, 'slides', MOTION_ID));
    const build = await runCli(['build'], project);
    expect(build.code, build.stderr).toBe(0);
    const url = 'http://127.0.0.1:43118';
    const server = startCliServer(['preview', '--host', '127.0.0.1', '--port', '43118'], project);
    let file: string;
    try {
      await waitForHttpOk(url);
      await page.goto(`${url}/s/${MOTION_ID}`);
      await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible();
      file = await downloadHtml(page, MOTION_ID, info);
    } finally {
      await stopServer(server);
    }
    await openOffline(page, context, file);
    await expect(page.locator('[data-entry-active="true"]')).toHaveCount(3);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await settled(page, '2');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.os-page:not([hidden]) [data-osd-step="revealed"]')).toHaveCount(1);
    await page.screenshot({ path: info.outputPath('production-offline-step.png') });
  });
});
