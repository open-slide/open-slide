import { CANVAS_HEIGHT, CANVAS_WIDTH } from './sdk';

function slidePath(base: string, slideId: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}s/${encodeURIComponent(slideId)}`;
}

export function embedUrl(origin: string, base: string, slideId: string): string {
  return new URL(`${slidePath(base, slideId)}/embed`, origin).href;
}

export function deckUrl(base: string, slideId: string, page: number): string {
  return `${slidePath(base, slideId)}?p=${page}`;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function embedCode(src: string, title: string): string {
  return `<iframe src="${escapeAttribute(src)}" title="${escapeAttribute(title)}" style="width:100%;aspect-ratio:${CANVAS_WIDTH}/${CANVAS_HEIGHT};border:0" allow="fullscreen" allowfullscreen></iframe>`;
}
