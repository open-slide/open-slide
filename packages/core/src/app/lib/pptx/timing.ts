import type { AnimationOrigin, AnimationTrigger, ElementAnimation, PptxTransition } from './scene';

const NS_MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
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
  const root = `<mc:AlternateContent xmlns:mc="${NS_MC}">`;

  if (transition.effect === 'morph') {
    const choice =
      `<mc:Choice Requires="p159" xmlns:p159="${NS_P159}" xmlns:p14="${NS_P14}">` +
      `<p:transition spd="${spd}" p14:dur="${transition.durationMs}">` +
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
    `<mc:Choice Requires="p14" xmlns:p14="${NS_P14}">` +
    `<p:transition spd="${spd}" p14:dur="${transition.durationMs}">` +
    `${effectXml(transition)}` +
    `</p:transition></mc:Choice>`;
  return (
    root +
    choice +
    `<mc:Fallback><p:transition spd="${spd}">${effectXml(transition)}</p:transition></mc:Fallback>` +
    `</mc:AlternateContent>`
  );
}

export type AnimationGroup = {
  animation: ElementAnimation;
  spids: number[];
};

const FLY_SUBTYPE: Record<AnimationOrigin, number> = { top: 1, right: 2, bottom: 4, left: 8 };
const WIPE_SUBTYPE: Record<AnimationOrigin, number> = { top: 4, bottom: 1, left: 2, right: 8 };
const WIPE_FILTER: Record<AnimationOrigin, string> = {
  top: 'wipe(down)',
  bottom: 'wipe(up)',
  left: 'wipe(right)',
  right: 'wipe(left)',
};
const FLY_START: Record<AnimationOrigin, string> = {
  top: '0-#ppt_h/2',
  bottom: '1+#ppt_h/2',
  left: '0-#ppt_w/2',
  right: '1+#ppt_w/2',
};
const NODE_TYPE: Record<AnimationTrigger, string> = {
  click: 'clickEffect',
  'with-previous': 'withEffect',
  'after-previous': 'afterEffect',
};

type Row = {
  animation: ElementAnimation;
  spid: number;
  nodeType: string;
  delay: number;
  grpId: number;
};
type Beat = { delay: number; leadDelay: number; rows: Row[] };
type ClickGroup = { autoStart: boolean; beats: Beat[] };

class IdAllocator {
  private next = 3;
  take(): number {
    return this.next++;
  }
}

export function timingXml(groups: AnimationGroup[]): string {
  const clickGroups = buildClickGroups(groups);
  if (clickGroups.length === 0) return '';

  const alloc = new IdAllocator();
  return rootXml(clickGroups.map((group) => groupXml(group, alloc)).join(''));
}

function buildClickGroups(groups: AnimationGroup[]): ClickGroup[] {
  const clickGroups: ClickGroup[] = [];
  let current: ClickGroup | null = null;
  let currentBeat: Beat | null = null;
  let beatStart = 0;
  let timelineEnd = 0;
  let grpId = 0;

  for (const { animation, spids } of groups) {
    if (spids.length === 0) continue;
    grpId += 1;

    if (animation.trigger === 'click') {
      current = { autoStart: false, beats: [] };
      clickGroups.push(current);
      currentBeat = null;
      timelineEnd = 0;
    } else if (current === null) {
      current = { autoStart: true, beats: [] };
      clickGroups.push(current);
    }

    if (animation.trigger === 'with-previous' && currentBeat !== null) {
      const rowDelay = currentBeat.leadDelay + animation.delayMs;
      pushRows(currentBeat, animation, spids, NODE_TYPE[animation.trigger], grpId, rowDelay);
      timelineEnd = Math.max(timelineEnd, beatStart + rowDelay + animation.durationMs);
      continue;
    }

    beatStart = animation.trigger === 'after-previous' ? timelineEnd : 0;
    currentBeat = { delay: beatStart, leadDelay: animation.delayMs, rows: [] };
    current.beats.push(currentBeat);

    const leading = current.beats.length === 1;
    const nodeType =
      leading && animation.trigger === 'after-previous'
        ? 'withEffect'
        : NODE_TYPE[animation.trigger];
    pushRows(currentBeat, animation, spids, nodeType, grpId, animation.delayMs);
    timelineEnd = Math.max(timelineEnd, beatStart + animation.delayMs + animation.durationMs);
  }

  return clickGroups;
}

function pushRows(
  beat: Beat,
  animation: ElementAnimation,
  spids: number[],
  nodeType: string,
  grpId: number,
  delay: number,
): void {
  beat.rows.push({ animation, spid: spids[0], nodeType, delay, grpId });
  for (const spid of spids.slice(1)) {
    beat.rows.push({ animation, spid, nodeType: 'withEffect', delay, grpId });
  }
}

function rootXml(groups: string): string {
  return (
    `<p:timing><p:tnLst><p:par>` +
    `<p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">` +
    `<p:childTnLst><p:seq concurrent="1" nextAc="seek">` +
    `<p:cTn id="2" dur="indefinite" nodeType="mainSeq">` +
    `<p:childTnLst>${groups}</p:childTnLst>` +
    `</p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>` +
    `</p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`
  );
}

function groupXml(group: ClickGroup, alloc: IdAllocator): string {
  const id = alloc.take();
  const cond = group.autoStart
    ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>'
    : '<p:cond delay="indefinite"/>';
  const beats = group.beats.map((beat) => beatXml(beat, alloc)).join('');
  return (
    `<p:par><p:cTn id="${id}" fill="hold">` +
    `<p:stCondLst>${cond}</p:stCondLst>` +
    `<p:childTnLst>${beats}</p:childTnLst>` +
    `</p:cTn></p:par>`
  );
}

function beatXml(beat: Beat, alloc: IdAllocator): string {
  const id = alloc.take();
  const rows = beat.rows.map((row) => rowXml(row, alloc)).join('');
  return (
    `<p:par><p:cTn id="${id}" fill="hold">` +
    `<p:stCondLst><p:cond delay="${beat.delay}"/></p:stCondLst>` +
    `<p:childTnLst>${rows}</p:childTnLst>` +
    `</p:cTn></p:par>`
  );
}

function rowXml(row: Row, alloc: IdAllocator): string {
  const id = alloc.take();
  const body = effectBody(row.animation, row.spid, alloc);
  return (
    `<p:par><p:cTn id="${id}" presetID="${presetId(row.animation.effect)}" presetClass="entr" presetSubtype="${presetSubtype(row.animation)}" fill="hold" grpId="${row.grpId}" nodeType="${row.nodeType}">` +
    `<p:stCondLst><p:cond delay="${row.delay}"/></p:stCondLst>` +
    `<p:childTnLst>${body}</p:childTnLst>` +
    `</p:cTn></p:par>`
  );
}

function presetId(effect: ElementAnimation['effect']): number {
  switch (effect) {
    case 'appear':
      return 1;
    case 'fade':
      return 10;
    case 'fly':
      return 2;
    case 'wipe':
      return 22;
    case 'zoom':
      return 23;
  }
}

function presetSubtype(animation: ElementAnimation): number {
  switch (animation.effect) {
    case 'appear':
    case 'fade':
      return 0;
    case 'fly':
      return FLY_SUBTYPE[animation.direction];
    case 'wipe':
      return WIPE_SUBTYPE[animation.direction];
    case 'zoom':
      return 16;
  }
}

function effectBody(animation: ElementAnimation, spid: number, alloc: IdAllocator): string {
  const set = visibilitySet(spid, alloc);
  switch (animation.effect) {
    case 'appear':
      return set;
    case 'fade':
      return set + animEffectXml('fade', animation.durationMs, spid, alloc);
    case 'wipe':
      return (
        set + animEffectXml(WIPE_FILTER[animation.direction], animation.durationMs, spid, alloc)
      );
    case 'fly':
      return set + flyMotions(animation, spid, alloc);
    case 'zoom':
      return set + zoomMotions(animation, spid, alloc);
  }
}

function visibilitySet(spid: number, alloc: IdAllocator): string {
  const id = alloc.take();
  return (
    `<p:set><p:cBhvr>` +
    `<p:cTn id="${id}" dur="1" fill="hold">` +
    `<p:stCondLst><p:cond delay="0"/></p:stCondLst>` +
    `</p:cTn>` +
    `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
    `<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>` +
    `</p:cBhvr>` +
    `<p:to><p:strVal val="visible"/></p:to>` +
    `</p:set>`
  );
}

function animEffectXml(
  filter: string,
  durationMs: number,
  spid: number,
  alloc: IdAllocator,
): string {
  const id = alloc.take();
  return (
    `<p:animEffect transition="in" filter="${filter}">` +
    `<p:cBhvr>` +
    `<p:cTn id="${id}" dur="${durationMs}"/>` +
    `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
    `</p:cBhvr>` +
    `</p:animEffect>`
  );
}

function flyMotions(animation: ElementAnimation, spid: number, alloc: IdAllocator): string {
  const vertical = animation.direction === 'top' || animation.direction === 'bottom';
  if (vertical) {
    return (
      animXml(
        'ppt_y',
        FLY_START[animation.direction],
        '#ppt_y',
        animation.durationMs,
        spid,
        alloc,
      ) + animXml('ppt_x', '#ppt_x', '#ppt_x', animation.durationMs, spid, alloc)
    );
  }
  return (
    animXml('ppt_x', FLY_START[animation.direction], '#ppt_x', animation.durationMs, spid, alloc) +
    animXml('ppt_y', '#ppt_y', '#ppt_y', animation.durationMs, spid, alloc)
  );
}

function zoomMotions(animation: ElementAnimation, spid: number, alloc: IdAllocator): string {
  return (
    animXml('ppt_w', '0', '#ppt_w', animation.durationMs, spid, alloc) +
    animXml('ppt_h', '0', '#ppt_h', animation.durationMs, spid, alloc)
  );
}

function animXml(
  attr: string,
  from: string,
  to: string,
  durationMs: number,
  spid: number,
  alloc: IdAllocator,
): string {
  const id = alloc.take();
  return (
    `<p:anim calcmode="lin" valueType="num">` +
    `<p:cBhvr additive="base">` +
    `<p:cTn id="${id}" dur="${durationMs}" fill="hold"/>` +
    `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>` +
    `<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst>` +
    `</p:cBhvr>` +
    `<p:tavLst>` +
    `<p:tav tm="0"><p:val>${valXml(from)}</p:val></p:tav>` +
    `<p:tav tm="100000"><p:val>${valXml(to)}</p:val></p:tav>` +
    `</p:tavLst>` +
    `</p:anim>`
  );
}

function valXml(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return `<p:fltVal val="${value}"/>`;
  return `<p:strVal val="${value}"/>`;
}
