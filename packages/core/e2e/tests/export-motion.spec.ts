import { expect, test } from '@playwright/test';
import { strFromU8 } from 'fflate';
import { exportDeck, openSlide } from './helpers.ts';

test.describe('pptx motion export', () => {
  test('writes native slide transitions', async ({ page }) => {
    await openSlide(page, 'motion');
    const parts = await exportDeck(page, 'Export as PPTX', 'motion.pptx');
    const slide1 = strFromU8(parts['ppt/slides/slide1.xml']);
    const slide2 = strFromU8(parts['ppt/slides/slide2.xml']);
    const slide3 = strFromU8(parts['ppt/slides/slide3.xml']);

    expect(slide1).toContain('<p:transition');
    expect(slide1).toContain('<p:fade/>');
    expect(slide2).toContain('<p:push dir="u"/>');
    expect(slide3).toContain('<p159:morph option="byObject"/>');
    expect(slide3).toContain('<mc:Fallback>');
  });

  test('leaves static decks free of motion xml', async ({ page }) => {
    await openSlide(page, 'alpha');
    const parts = await exportDeck(page, 'Export as PPTX');
    for (const name of Object.keys(parts)) {
      if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
      const xml = strFromU8(parts[name]);
      expect(xml).not.toContain('<p:transition');
      expect(xml).not.toContain('<p:timing');
    }
  });
});
