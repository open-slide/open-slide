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

  test('writes element animations and groups every shape from one element', async ({ page }) => {
    await openSlide(page, 'motion');
    const parts = await exportDeck(page, 'Export as PPTX', 'motion.pptx');
    const slide2 = strFromU8(parts['ppt/slides/slide2.xml']);
    const slide4 = strFromU8(parts['ppt/slides/slide4.xml']);

    expect(slide2).toContain('<p:timing>');
    expect(slide2).toContain('presetID="10"');
    expect(slide2).toContain('presetID="2"');
    expect(slide2).toContain('presetID="23"');
    expect(slide2).toContain('nodeType="withEffect"');
    expect(slide2).toContain('nodeType="clickEffect"');
    expect(slide2).toContain('1+#ppt_h/2');
    expect(slide2).toContain('<p:attrName>ppt_w</p:attrName>');

    const spids = [...slide2.matchAll(/<p:spTgt spid="(\d+)"/g)].map((m) => m[1]);
    expect(spids.length).toBeGreaterThanOrEqual(4);
    for (const spid of new Set(spids)) {
      expect(slide2).toContain(`<p:cNvPr id="${spid}"`);
    }

    const cardPanes = [...slide2.matchAll(/grpId="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(cardPanes).size).toBeGreaterThanOrEqual(3);

    expect(slide4).not.toContain('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="101014">');
    expect(slide4).toContain('<p:timing>');
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
