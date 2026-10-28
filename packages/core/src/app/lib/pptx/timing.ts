import type { PptxTransition } from './scene';

const NS_MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const NS_P14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
const NS_P159 = 'http://schemas.microsoft.com/office/powerpoint/2015/09/main';

const DIRECTION: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: 'u',
  down: 'd',
  left: 'l',
  right: 'r',
};

function spdFor(durationMs: number): 'fast' | 'med' | 'slow' {
  if (durationMs <= 500) return 'fast';
  if (durationMs <= 1000) return 'med';
  return 'slow';
}

function effectXml(transition: PptxTransition): string {
  switch (transition.effect) {
    case 'fade':
      return '<p:fade/>';
    case 'push':
      return `<p:push dir="${DIRECTION[transition.direction ?? 'up']}"/>`;
    case 'wipe':
      return `<p:wipe dir="${DIRECTION[transition.direction ?? 'up']}"/>`;
    case 'morph':
      return '<p159:morph option="byObject"/>';
  }
}

export function transitionXml(transition: PptxTransition | null): string {
  if (transition === null) return '';
  const spd = spdFor(transition.durationMs);
  const root = `<mc:AlternateContent xmlns:mc="${NS_MC}" xmlns:p="${NS_P}">`;

  if (transition.effect === 'morph') {
    const choice =
      `<mc:Choice Requires="p159">` +
      `<p:transition xmlns:p14="${NS_P14}" xmlns:p159="${NS_P159}" spd="${spd}" p14:dur="${transition.durationMs}">` +
      `<p159:morph option="byObject"/>` +
      `</p:transition></mc:Choice>`;
    return (
      root +
      choice +
      `<mc:Fallback><p:transition spd="${spd}"><p:fade/></p:transition></mc:Fallback>` +
      `</mc:AlternateContent>`
    );
  }

  const choice =
    `<mc:Choice Requires="p14">` +
    `<p:transition xmlns:p14="${NS_P14}" spd="${spd}" p14:dur="${transition.durationMs}">` +
    `${effectXml(transition)}` +
    `</p:transition></mc:Choice>`;
  return (
    root +
    choice +
    `<mc:Fallback><p:transition spd="${spd}">${effectXml(transition)}</p:transition></mc:Fallback>` +
    `</mc:AlternateContent>`
  );
}
