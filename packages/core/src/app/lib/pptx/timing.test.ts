import { describe, expect, it } from 'vitest';
import type { ElementAnimation } from './scene';
import { timingXml, transitionXml } from './timing';

const NS_MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
const NS_P14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
const NS_P159 = 'http://schemas.microsoft.com/office/powerpoint/2015/09/main';

function openingTag(xml: string, name: string): string {
  return new RegExp(`<${name}\\b[^>]*>`).exec(xml)?.[0] ?? '';
}

function expectP14Choice(xml: string, durationMs: number): void {
  const choice = openingTag(xml, 'mc:Choice');
  expect(choice).toContain('Requires="p14"');
  expect(choice).toContain(`xmlns:p14="${NS_P14}"`);

  const transition = openingTag(xml, 'p:transition');
  expect(transition).toContain(`p14:dur="${durationMs}"`);
  expect(transition).not.toContain('xmlns:p14');
}

describe('transitionXml', () => {
  it('returns an empty string for no transition', () => {
    expect(transitionXml(null)).toBe('');
  });

  it('emits fade with p14 duration on the transition and a plain fallback', () => {
    const xml = transitionXml({ effect: 'fade', durationMs: 320, direction: null });
    expect(xml).toContain(`<mc:AlternateContent xmlns:mc="${NS_MC}">`);
    expect(xml).not.toContain('xmlns:p="');
    expect(xml).toContain('<p:fade/>');
    expect(xml).toContain(
      '<mc:Fallback><p:transition spd="fast"><p:fade/></p:transition></mc:Fallback>',
    );
    expectP14Choice(xml, 320);
  });

  it('maps push directions to p:push dir', () => {
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'up' })).toContain(
      '<p:push dir="u"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'down' })).toContain(
      '<p:push dir="d"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'left' })).toContain(
      '<p:push dir="l"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'right' })).toContain(
      '<p:push dir="r"/>',
    );
  });

  it('emits wipe with the side direction', () => {
    expect(transitionXml({ effect: 'wipe', durationMs: 500, direction: 'left' })).toContain(
      '<p:wipe dir="l"/>',
    );
  });

  it('declares p14 on the mc choice and not on the transition', () => {
    expectP14Choice(transitionXml({ effect: 'fade', durationMs: 320, direction: null }), 320);
    expectP14Choice(transitionXml({ effect: 'push', durationMs: 400, direction: 'up' }), 400);
    expectP14Choice(transitionXml({ effect: 'wipe', durationMs: 500, direction: 'left' }), 500);
  });

  it('emits morph with p159 and p14 namespaces on the choice', () => {
    const xml = transitionXml({ effect: 'morph', durationMs: 900, direction: null });
    expect(xml).toContain('<p159:morph option="byObject"/>');
    expect(xml).toContain(
      '<mc:Fallback><p:transition spd="med"><p:fade/></p:transition></mc:Fallback>',
    );

    const choice = openingTag(xml, 'mc:Choice');
    expect(choice).toContain('Requires="p159"');
    expect(choice).toContain(`xmlns:p159="${NS_P159}"`);
    expect(choice).toContain(`xmlns:p14="${NS_P14}"`);

    const transition = openingTag(xml, 'p:transition');
    expect(transition).toContain('spd="med"');
    expect(transition).toContain('p14:dur="900"');
    expect(transition).not.toContain('xmlns:p159');
    expect(transition).not.toContain('xmlns:p14');
  });
});

const animation = (overrides: Partial<ElementAnimation> = {}): ElementAnimation => ({
  id: 1,
  effect: 'fade',
  trigger: 'with-previous',
  durationMs: 500,
  delayMs: 0,
  direction: 'bottom',
  ...overrides,
});

const group = (
  overrides: Partial<ElementAnimation> = {},
  spids = [2],
): { animation: ElementAnimation; spids: number[] } => ({
  animation: animation(overrides),
  spids,
});

describe('timingXml', () => {
  it('returns an empty string with no groups', () => {
    expect(timingXml([])).toBe('');
  });

  it('emits a with-previous fade on slide entry', () => {
    const xml = timingXml([group()]);
    expect(xml).toContain('<p:timing>');
    expect(xml).toContain('nodeType="withEffect"');
    expect(xml).toContain('presetID="10"');
    expect(xml).toContain('presetClass="entr"');
    expect(xml).toContain('<p:spTgt spid="2"/>');
    expect(xml).toContain('<p:animEffect transition="in" filter="fade">');
    expect(xml).toContain('dur="500"');
  });

  it('opens a click group for a click trigger', () => {
    const xml = timingXml([group({ trigger: 'click' })]);
    expect(xml).toContain('nodeType="clickEffect"');
    expect(xml).toContain('<p:cond delay="indefinite"/>');
  });

  it('emits a leading after-previous as withEffect in an auto-start group', () => {
    const xml = timingXml([group({ trigger: 'after-previous' })]);
    expect(xml).toContain('nodeType="withEffect"');
    expect(xml).not.toContain('nodeType="afterEffect"');
    expect(xml).toContain('<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>');
  });

  it('uses afterEffect for an after-previous that follows an effect', () => {
    const xml = timingXml([
      group({ trigger: 'click', durationMs: 500 }, [2]),
      group({ trigger: 'after-previous', delayMs: 50, durationMs: 300 }, [3]),
    ]);
    expect(xml).toContain('nodeType="afterEffect"');
    expect(xml).toContain('<p:stCondLst><p:cond delay="500"/></p:stCondLst>');
  });

  it('waits on the click for click groups and on the main sequence for auto-start', () => {
    const click = timingXml([group({ trigger: 'click' })]);
    expect(click).toContain('<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst>');
    expect(click).not.toContain('evt="onBegin"');

    const auto = timingXml([group()]);
    expect(auto).toContain(
      '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>',
    );
  });

  it('starts an after-previous beat at the end of the current timeline', () => {
    const xml = timingXml([
      group({ trigger: 'with-previous', delayMs: 100, durationMs: 500 }, [2]),
      group({ trigger: 'with-previous', delayMs: 50 }, [3]),
      group({ trigger: 'after-previous', delayMs: 25 }, [4]),
    ]);
    expect((xml.match(/<p:cond delay="indefinite"\/>/g) ?? []).length).toBe(1);
    expect(xml).toContain('<p:stCondLst><p:cond delay="650"/></p:stCondLst>');
  });

  it('gives every cTn a unique id after the fixed root ids', () => {
    const xml = timingXml([group({}, [2, 3]), group({ trigger: 'click' }, [4])]);
    expect(xml).toContain('<p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">');
    expect(xml).toContain('<p:cTn id="2" dur="indefinite" nodeType="mainSeq">');
    const ids = [...xml.matchAll(/<p:cTn id="(\d+)"/g)].map((match) => Number(match[1]));
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.max(...ids)).toBe(ids.length);
  });

  it('drops groups without shapes and numbers grpId by kept group', () => {
    expect(timingXml([group({}, [])])).toBe('');
    const xml = timingXml([
      group({ trigger: 'click' }, []),
      group({ trigger: 'click' }, [2]),
      group({ trigger: 'click' }, [3]),
    ]);
    expect(xml).toContain('grpId="1"');
    expect(xml).toContain('grpId="2"');
    expect(xml).not.toContain('grpId="3"');
  });

  it('emits later shapes from one group as withEffect rows with the group delay', () => {
    const xml = timingXml([group({ trigger: 'click', delayMs: 400 }, [2, 3])]);
    expect((xml.match(/nodeType="clickEffect"/g) ?? []).length).toBe(1);
    expect((xml.match(/nodeType="withEffect"/g) ?? []).length).toBe(1);
    expect((xml.match(/delay="400"/g) ?? []).length).toBe(2);
    expect(xml).toMatch(/nodeType="withEffect"><p:stCondLst><p:cond delay="400"\/><\/p:stCondLst>/);
  });

  it('gives every shape in a delayed group the same row delay as its leader', () => {
    const xml = timingXml([group({ trigger: 'with-previous', delayMs: 250 }, [2, 3, 4])]);
    const rowDelays = [
      ...xml.matchAll(/grpId="1" nodeType="[^"]+"><p:stCondLst><p:cond delay="(\d+)"\/>/g),
    ].map((match) => match[1]);
    expect(rowDelays).toEqual(['250', '250', '250']);
  });

  it('starts a with-previous follower after a delayed leader', () => {
    const xml = timingXml([
      group({ trigger: 'with-previous', delayMs: 200 }, [2]),
      group({ trigger: 'with-previous', delayMs: 0 }, [3]),
    ]);
    const rowDelays = [
      ...xml.matchAll(/grpId="\d+" nodeType="[^"]+"><p:stCondLst><p:cond delay="(\d+)"\/>/g),
    ].map((match) => match[1]);
    expect(rowDelays).toEqual(['200', '200']);
    const beatDelays = [
      ...xml.matchAll(
        /<p:cTn id="\d+" fill="hold"><p:stCondLst><p:cond delay="(\d+)"\/><\/p:stCondLst><p:childTnLst>/g,
      ),
    ].map((match) => match[1]);
    expect(beatDelays).toEqual(['0']);
  });

  it('offsets a delayed with-previous follower from a click leader delay', () => {
    const xml = timingXml([
      group({ trigger: 'click', delayMs: 100 }, [2]),
      group({ trigger: 'with-previous', delayMs: 50 }, [3]),
    ]);
    const rowDelays = [
      ...xml.matchAll(/grpId="\d+" nodeType="[^"]+"><p:stCondLst><p:cond delay="(\d+)"\/>/g),
    ].map((match) => match[1]);
    expect(rowDelays).toEqual(['100', '150']);
    expect((xml.match(/nodeType="clickEffect"/g) ?? []).length).toBe(1);
    expect((xml.match(/nodeType="withEffect"/g) ?? []).length).toBe(1);
    const beatDelays = [
      ...xml.matchAll(
        /<p:cTn id="\d+" fill="hold"><p:stCondLst><p:cond delay="(\d+)"\/><\/p:stCondLst><p:childTnLst>/g,
      ),
    ].map((match) => match[1]);
    expect(beatDelays).toEqual(['0']);
  });

  it('keeps multiple shapes from one element in one group', () => {
    const xml = timingXml([group({}, [2, 3])]);
    expect((xml.match(/grpId="1"/g) ?? []).length).toBe(2);
    expect(xml).toContain('<p:spTgt spid="2"/>');
    expect(xml).toContain('<p:spTgt spid="3"/>');
  });

  it('maps fly directions to preset subtype and motion', () => {
    const xml = timingXml([group({ effect: 'fly', direction: 'bottom' }, [4])]);
    expect(xml).toContain('presetID="2"');
    expect(xml).toContain('presetSubtype="4"');
    expect(xml).toContain('1+#ppt_h/2');
    expect(xml).toContain('<p:attrName>ppt_y</p:attrName>');
  });

  it('maps wipe directions to the filter', () => {
    const xml = timingXml([group({ effect: 'wipe', direction: 'bottom' }, [5])]);
    expect(xml).toContain('presetID="22"');
    expect(xml).toContain('filter="wipe(up)"');
  });

  it('maps zoom to width and height motion', () => {
    const xml = timingXml([group({ effect: 'zoom' }, [6])]);
    expect(xml).toContain('presetID="23"');
    expect(xml).toContain('<p:attrName>ppt_w</p:attrName>');
    expect(xml).toContain('<p:attrName>ppt_h</p:attrName>');
    expect(xml).toContain('<p:fltVal val="0"/>');
  });

  it('emits appear as a visibility set without an effect filter', () => {
    const xml = timingXml([group({ effect: 'appear', durationMs: 1 }, [7])]);
    expect(xml).toContain('presetID="1"');
    expect(xml).toContain('<p:set>');
    expect(xml).not.toContain('animEffect');
  });
});
