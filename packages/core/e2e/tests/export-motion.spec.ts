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
    const targets = new Set(spids);
    // h1, card background, card title, card body, zoom background, zoom text.
    expect(targets.size).toBe(6);
    // Each effect emits a visibility set plus one or two motion rows, so rows outnumber targets.
    expect(spids.length).toBe(17);
    for (const spid of targets) {
      expect(slide2).toContain(`<p:cNvPr id="${spid}"`);
    }

    const rows = [...slide2.matchAll(/grpId="(\d+)"[^>]*>([\s\S]*?)<\/p:cTn><\/p:par>/g)];
    const groupTargets = new Map<string, Set<string>>();
    for (const [, grp, body] of rows) {
      const set = groupTargets.get(grp) ?? new Set<string>();
      for (const m of body.matchAll(/<p:spTgt spid="(\d+)"/g)) set.add(m[1]);
      groupTargets.set(grp, set);
    }
    expect([...groupTargets.keys()]).toEqual(['1', '2', '3']);
    expect([...groupTargets.values()].map((set) => set.size)).toEqual([1, 3, 2]);

    expect(slide4).not.toContain('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="101014">');
    expect(slide4).toContain('<p:timing>');
  });

  test('exports steps as click reveals in dom order', async ({ page }) => {
    await openSlide(page, 'steps');
    const parts = await exportDeck(page, 'Export as PPTX', 'steps.pptx');
    const slide2 = strFromU8(parts['ppt/slides/slide2.xml']);

    expect(slide2).toContain('<p:timing>');
    expect((slide2.match(/nodeType="clickEffect"/g) ?? []).length).toBe(2);
    expect(slide2).toContain('presetID="10"');
    expect((slide2.match(/dur="180"/g) ?? []).length).toBe(2);

    const textShapeId = (text: string): string => {
      const shape = slide2.split('<p:sp>').find((part) => part.includes(`<a:t>${text}</a:t>`));
      expect(shape).toBeDefined();
      return /<p:cNvPr id="(\d+)"/.exec(shape ?? '')?.[1] ?? '';
    };

    const first = textShapeId('Step item first');
    const second = textShapeId('Step item second');
    expect(first).not.toBe('');
    expect(second).not.toBe('');
    expect(slide2.indexOf(`spid="${first}"`)).toBeLessThan(slide2.indexOf(`spid="${second}"`));
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

  test('image pptx of the motion deck stays static', async ({ page }) => {
    await openSlide(page, 'motion');
    const parts = await exportDeck(page, 'Export as image PPTX', 'motion.pptx');
    for (const name of Object.keys(parts)) {
      if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
      const xml = strFromU8(parts[name]);
      expect(xml).not.toContain('<p:transition');
      expect(xml).not.toContain('<p:timing');
    }
  });
});
