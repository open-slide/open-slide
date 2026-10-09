import { expect, test } from '@playwright/test';
import { deleteSlide, duplicateSlide, openSlide, readSlideSource } from './helpers.ts';

test.describe('notes autosave responses', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const slideId of createdSlides.splice(0)) await deleteSlide(request, slideId);
  });

  for (const edit of ['insert', 'revert'] as const) {
    test(`keeps ${edit} edits and their selection until the next autosave`, async ({
      page,
      request,
    }) => {
      const slideId = `notes-newer-input-${edit}`;
      const expected = edit === 'insert' ? 'hello NEW world' : 'Alpha speaker note';
      const caret = edit === 'insert' ? 10 : 7;
      createdSlides.push(slideId);
      await duplicateSlide(request, 'alpha', slideId);
      await openSlide(page, slideId);
      const drawer = page.locator('[data-notes-drawer]');
      await drawer.getByRole('button', { name: /Notes/ }).click();
      const notes = drawer.locator('textarea');
      await expect(notes).toBeVisible();
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);

      let release = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      let written = () => {};
      const firstWrite = new Promise<void>((resolve) => {
        written = resolve;
      });
      await page.route(
        '**/__notes',
        async (route) => {
          const response = await route.fetch();
          written();
          await held;
          await route.fulfill({ response });
        },
        { times: 1 },
      );

      try {
        await notes.fill('hello world');
        await page.clock.fastForward(600);
        await firstWrite;
        if (edit === 'insert') {
          await notes.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 6));
          await page.keyboard.insertText('NEW ');
        } else {
          await notes.fill(expected);
          await notes.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(7, 7));
        }
        await expect(notes).toHaveValue(expected);
        const saved = page.waitForResponse('**/__notes');
        release();
        await (await saved).finished();
        await expect(drawer.locator('[aria-live]')).toHaveText('');
        await expect(notes).toHaveValue(expected);
        expect(
          await notes.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd]),
        ).toEqual([caret, caret]);
        await expect(notes).toBeFocused();

        const latestSaved = page.waitForResponse('**/__notes');
        await page.clock.fastForward(600);
        expect((await latestSaved).request().postDataJSON().text).toBe(expected);
        await expect(drawer.locator('[aria-live]')).toHaveText('Saved');
        await expect.poll(() => readSlideSource(slideId)).toContain(expected);
        await page.clock.resume();
        await page.reload();
        await expect(page.locator('[data-notes-drawer] textarea')).toHaveValue(expected);
      } finally {
        release();
      }
    });
  }

  test('flushes a reverted note when leaving a page with a pending save', async ({
    page,
    request,
  }) => {
    const slideId = 'notes-revert-navigation';
    createdSlides.push(slideId);
    await duplicateSlide(request, 'alpha', slideId);
    await openSlide(page, slideId);
    const drawer = page.locator('[data-notes-drawer]');
    await drawer.getByRole('button', { name: /Notes/ }).click();
    const notes = drawer.locator('textarea');
    await expect(notes).toBeVisible();
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);

    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let written = () => {};
    const firstWrite = new Promise<void>((resolve) => {
      written = resolve;
    });
    await page.route(
      '**/__notes',
      async (route) => {
        const response = await route.fetch();
        written();
        await held;
        await route.fulfill({ response });
      },
      { times: 1 },
    );

    try {
      await notes.fill('Pending first page note');
      await page.clock.fastForward(600);
      await firstWrite;
      await notes.fill('Alpha speaker note');
      await page.getByRole('button', { name: 'Go to page 2' }).evaluate((el: HTMLButtonElement) => {
        el.click();
      });
      await expect(notes).toHaveValue('');
      await expect.poll(() => readSlideSource(slideId)).toContain('Alpha speaker note');
      release();
      await page.getByRole('button', { name: 'Go to page 1' }).evaluate((el: HTMLButtonElement) => {
        el.click();
      });
      await expect(notes).toHaveValue('Alpha speaker note');
    } finally {
      release();
    }
  });

  for (const delayStage of ['request', 'response'] as const) {
    for (const saveMode of ['blur', 'autosave'] as const) {
      test(`keeps another page's pending ${delayStage} when saving by ${saveMode}`, async ({
        page,
        request,
      }) => {
        const slideId = `notes-cross-page-${delayStage}-${saveMode}`;
        createdSlides.push(slideId);
        await duplicateSlide(request, 'alpha', slideId);
        await openSlide(page, slideId);
        const drawer = page.locator('[data-notes-drawer]');
        await drawer.getByRole('button', { name: /Notes/ }).click();
        const notes = drawer.locator('textarea');
        await expect(notes).toBeVisible();
        await page.clock.install({ time: 0 });
        await page.clock.pauseAt(1000);

        let release = () => {};
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        const failedSaves: unknown[] = [];
        page.on('requestfailed', (req) => {
          if (req.url().endsWith('/__notes')) failedSaves.push(req.postDataJSON());
        });
        let started = () => {};
        const firstRequest = new Promise<void>((resolve) => {
          started = resolve;
        });
        let written = () => {};
        const firstWrite = new Promise<void>((resolve) => {
          written = resolve;
        });
        let finished = () => {};
        const firstResponse = new Promise<void>((resolve) => {
          finished = resolve;
        });
        await page.route(
          '**/__notes',
          async (route) => {
            started();
            if (delayStage === 'request') await held;
            const response = await route.fetch();
            written();
            if (delayStage === 'response') await held;
            await route.fulfill({ response });
            finished();
          },
          { times: 1 },
        );

        try {
          await notes.fill('First page retained note');
          await page
            .getByRole('button', { name: 'Go to page 2' })
            .evaluate((el: HTMLButtonElement) => {
              el.click();
            });
          await firstRequest;
          if (delayStage === 'response') await firstWrite;
          await expect(notes).toHaveValue('');
          await notes.fill('Second page retained note');
          const secondSaved = page.waitForResponse('**/__notes');
          if (saveMode === 'blur') await notes.blur();
          else await page.clock.fastForward(600);
          expect((await secondSaved).request().postDataJSON()).toMatchObject({
            slideId,
            index: 1,
            text: 'Second page retained note',
          });
          await expect(drawer.locator('[aria-live]')).toHaveText('Saved');
          expect(failedSaves).toEqual([]);
          if (delayStage === 'request') {
            expect(await readSlideSource(slideId)).not.toContain('First page retained note');
          }
          release();
          await firstResponse;
          await page.clock.runFor(50);
          await expect(drawer.locator('[aria-live]')).toHaveText('Saved');
          await expect(notes).toHaveValue('Second page retained note');
          await expect.poll(() => readSlideSource(slideId)).toContain('First page retained note');
          await expect.poll(() => readSlideSource(slideId)).toContain('Second page retained note');
          await page
            .getByRole('button', { name: 'Go to page 1' })
            .evaluate((el: HTMLButtonElement) => {
              el.click();
            });
          await expect(notes).toHaveValue('First page retained note');
          await page.clock.resume();
          await page.reload();
          await expect(page.locator('[data-notes-drawer] textarea')).toHaveValue(
            'First page retained note',
          );
        } finally {
          release();
        }
      });
    }
  }

  for (const responseStatus of [200, 500]) {
    test(`ignores a previous page's delayed ${responseStatus} response`, async ({
      page,
      request,
    }) => {
      const slideId = `notes-previous-page-${responseStatus}`;
      createdSlides.push(slideId);
      await duplicateSlide(request, 'alpha', slideId);
      await openSlide(page, slideId);
      const drawer = page.locator('[data-notes-drawer]');
      await drawer.getByRole('button', { name: /Notes/ }).click();
      const notes = drawer.locator('textarea');
      await expect(notes).toBeVisible();
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);

      let release = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      const saved = page.waitForResponse('**/__notes');
      await page.route(
        '**/__notes',
        async (route) => {
          const response = responseStatus === 200 ? await route.fetch() : undefined;
          await held;
          if (response) await route.fulfill({ response });
          else await route.fulfill({ status: 500, json: { error: 'old page save failed' } });
        },
        { times: 1 },
      );

      try {
        await notes.fill('First page note');
        await page
          .getByRole('button', { name: 'Go to page 2' })
          .evaluate((el: HTMLButtonElement) => {
            el.click();
          });
        await expect(page).toHaveURL(/[?&]p=2/);
        await expect(notes).toHaveValue('');
        await notes.fill('Second page draft');
        await notes.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(7, 7));
        release();
        await (await saved).finished();
        await page.clock.runFor(50);
        await expect(drawer.locator('[aria-live]')).toHaveText('');
        await expect(notes).toHaveValue('Second page draft');
        expect(await notes.evaluate((el: HTMLTextAreaElement) => el.selectionStart)).toBe(7);

        const latestSaved = page.waitForResponse('**/__notes');
        await page.clock.fastForward(600);
        const body = (await latestSaved).request().postDataJSON();
        expect(body).toMatchObject({ slideId, index: 1, text: 'Second page draft' });
        await expect(drawer.locator('[aria-live]')).toHaveText('Saved');
        await expect.poll(() => readSlideSource(slideId)).toContain('Second page draft');
      } finally {
        release();
      }
    });
  }
});
