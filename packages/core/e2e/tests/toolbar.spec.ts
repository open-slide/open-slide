import { expect, type Page, test } from '@playwright/test';
import { deleteSlide, duplicateSlide, editorCanvas, openSlide } from './helpers.ts';

const longTitle = 'Yiwei Ho — Introduction to building thoughtful presentations and creative tools';

async function expectToolbarToFit(page: Page) {
  await expect
    .poll(() =>
      page.getByRole('banner').evaluate((header) => {
        const problems: string[] = [];
        const headerBounds = header.getBoundingClientRect();
        const controls = Array.from(
          header.querySelectorAll<HTMLElement>('button, input, [role="tab"]'),
        )
          .map((element) => ({
            name:
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.textContent?.trim() ||
              element.tagName,
            bounds: element.getBoundingClientRect(),
          }))
          .filter(({ bounds }) => bounds.width > 0 && bounds.height > 0);

        if (header.scrollWidth > header.clientWidth + 1) problems.push('Toolbar overflows');
        if (document.documentElement.scrollWidth > window.innerWidth + 1) {
          problems.push('Document overflows');
        }
        for (const [index, control] of controls.entries()) {
          const { bounds, name } = control;
          if (
            bounds.left < -0.5 ||
            bounds.right > window.innerWidth + 0.5 ||
            bounds.top < headerBounds.top - 0.5 ||
            bounds.bottom > headerBounds.bottom + 0.5
          ) {
            problems.push(`${name} is outside the toolbar`);
          }
          for (const other of controls.slice(index + 1)) {
            const overlapWidth =
              Math.min(bounds.right, other.bounds.right) - Math.max(bounds.left, other.bounds.left);
            const overlapHeight =
              Math.min(bounds.bottom, other.bounds.bottom) - Math.max(bounds.top, other.bounds.top);
            if (overlapWidth > 0.5 && overlapHeight > 0.5) {
              problems.push(`${name} overlaps ${other.name}`);
            }
          }
        }
        return problems;
      }),
    )
    .toEqual([]);
}

async function openTools(page: Page) {
  const trigger = page.getByRole('button', { name: 'More actions', exact: true });
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menu')).toBeFocused();
}

async function closeTools(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
}

test.describe('responsive slide toolbar', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  for (const width of [320, 390, 640, 768, 1018, 1024, 1440]) {
    test(`keeps long titles and controls separate at ${width}px`, async ({
      page,
      request,
    }, testInfo) => {
      const slideId = `toolbar-${width}`;
      createdSlides.push(slideId);
      await page.setViewportSize({ width, height: 900 });
      await duplicateSlide(request, 'alpha', slideId);
      await openSlide(page, slideId);

      const toolbar = page.getByRole('banner');
      const title = toolbar.getByRole('button', { name: 'Rename slide', exact: true });
      await title.click();
      await toolbar.getByRole('textbox').fill(longTitle);
      await toolbar.getByRole('textbox').press('Enter');
      await expect(title).toContainText(longTitle);
      await expect(toolbar.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
      await expectToolbarToFit(page);
      await testInfo.attach(`toolbar-${width}px.png`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });

      await title.click();
      const input = toolbar.getByRole('textbox');
      await input.fill('W'.repeat(80));
      await expect(input).toBeFocused();
      await expectToolbarToFit(page);
      await input.press('Escape');
      await expect(title).toContainText(longTitle);

      await toolbar.getByRole('tab', { name: 'Assets', exact: true }).click();
      await expect(page).toHaveURL(/[?&]view=assets/);
      await expect(title).toBeVisible();
      await expectToolbarToFit(page);
      await toolbar.getByRole('tab', { name: 'Slides', exact: true }).click();
      await expect(editorCanvas(page)).toBeVisible();
      await expectToolbarToFit(page);
    });
  }

  test('compact tools keep their state across repeated use and presentation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openSlide(page, 'alpha');

    for (let repeat = 0; repeat < 2; repeat++) {
      await openTools(page);
      await closeTools(page);
      await openTools(page);
      await page.getByRole('menuitemradio', { name: 'Preview', exact: true }).click();
      await closeTools(page);
      await openTools(page);
      await expect(
        page.getByRole('menuitemradio', { name: 'Preview', exact: true }),
      ).toHaveAttribute('aria-checked', 'true');
      await page.getByRole('menuitemradio', { name: 'Edit', exact: true }).click();
      await closeTools(page);
      await openTools(page);
      await expect(page.getByRole('menuitemradio', { name: 'Edit', exact: true })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await page.getByRole('menuitemcheckbox', { name: 'Design', exact: true }).click();
      await closeTools(page);
      await expect(page.locator('aside[data-design-ui]')).toBeVisible();
      await openTools(page);
      await expect(
        page.getByRole('menuitemcheckbox', { name: 'Design', exact: true }),
      ).toHaveAttribute('aria-checked', 'true');
      await page.getByRole('menuitemcheckbox', { name: 'Format', exact: true }).click();
      await closeTools(page);
      await expect(page.locator('aside[data-inspector-ui]')).toBeVisible();
      await expect(page.locator('aside[data-design-ui]')).toHaveCount(0);
      await openTools(page);
      await expect(
        page.getByRole('menuitemcheckbox', { name: 'Format', exact: true }),
      ).toHaveAttribute('aria-checked', 'true');
      await expect(
        page.getByRole('menuitemcheckbox', { name: 'Design', exact: true }),
      ).toHaveAttribute('aria-checked', 'false');
      await page.getByRole('menuitemcheckbox', { name: 'Format', exact: true }).click();
      await closeTools(page);
      await expect(page.locator('aside[data-inspector-ui]')).toHaveCount(0);
      await expectToolbarToFit(page);
    }

    await openTools(page);
    await page.getByRole('menuitem', { name: 'Commands', exact: true }).click();
    const commandInput = page.getByPlaceholder('Search this deck or run a command');
    await expect(commandInput).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(commandInput).toBeHidden();
    await expect(page.getByRole('menu')).toHaveCount(0);

    for (let repeat = 0; repeat < 2; repeat++) {
      await page.getByRole('button', { name: 'Present options', exact: true }).click();
      await expect(page.getByRole('menu')).toBeFocused();
      await expect(page.getByRole('menuitem', { name: /^Play/ })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /^Fullscreen/ })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /^Presenter mode/ })).toBeVisible();
      await closeTools(page);
    }

    await page.getByRole('button', { name: 'Present', exact: true }).click();
    await expect(editorCanvas(page)).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(editorCanvas(page)).toBeVisible();
    await expectToolbarToFit(page);
  });

  test('resizing closes tools and keeps the controls usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openSlide(page, 'alpha');
    const moreActions = page.getByRole('button', { name: 'More actions', exact: true });

    await openTools(page);
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(moreActions).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible();
    await expectToolbarToFit(page);

    await openTools(page);
    await expect(page.getByRole('menuitem', { name: 'Copy link', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(moreActions).toBeHidden();
    await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toBeVisible();
    await expectToolbarToFit(page);

    const download = page.getByRole('button', { name: 'Download', exact: true });
    await download.click();
    await expect(page.getByRole('menu')).toBeFocused();
    await expect(page.getByRole('menuitem', { name: 'Export as HTML', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(download).toBeHidden();
    await openTools(page);
    await expect(page.getByRole('menuitem', { name: 'Export as HTML', exact: true })).toBeVisible();
    await closeTools(page);

    await page.setViewportSize({ width: 320, height: 900 });
    await openTools(page);
    await expect(page.getByRole('menuitemradio', { name: 'Edit', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await closeTools(page);
    await expectToolbarToFit(page);
  });
});
