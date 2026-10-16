import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { designToCssVars } from './design';
import { downloadBlob, nextFrame } from './dom';
import { SlidePageProvider } from './page-context';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from './sdk';
import { StepHost } from './step-context';
import { holdOpacity, resolveTransition, type SlideTransition } from './transition';

type AssetEntry = { name: string; bytes: Uint8Array };

const ASSET_EXT_RE =
  /\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|woff2?|ttf|otf|mp3|wav|ogg)(?:\?[^#]*)?(?:#.*)?$/i;

export async function exportSlideAsHtml(slide: SlideModule, slideId: string): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const title = slide.meta?.title ?? slideId;

  const pagesHtml = await renderPagesToHtml(pages, slide.htmlExport?.activePage === true);
  const bundledCss = collectCss();
  const externalLinks = collectExternalStylesheetLinks();

  const assets = new Map<string, AssetEntry>();
  const usedNames = new Set<string>();

  const urls = new Set<string>([
    ...findHtmlAssetUrls(pagesHtml.join('\n')),
    ...findCssAssetUrls(bundledCss),
  ]);

  for (const url of urls) {
    const absolute = toAbsolute(url);
    if (!absolute) continue;
    try {
      const res = await fetch(absolute);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      const name = uniqueAssetName(absolute, usedNames);
      assets.set(url, { name, bytes: buf });
    } catch {}
  }

  const rewrittenPages = pagesHtml.map((html) => rewriteUrls(html, assets, 'html'));
  const rewrittenCss = rewriteUrls(bundledCss, assets, 'css');

  const html = buildHtml({
    title,
    pagesHtml: rewrittenPages,
    bundledCss: rewrittenCss,
    externalLinks,
    design: slide.design,
    transitions: pages.map((_, index) => resolveTransition(pages, index, slide.transition)),
  });

  const htmlBytes = new TextEncoder().encode(html);

  if (assets.size === 0) {
    downloadBlob(new Blob([htmlBytes as BlobPart], { type: 'text/html' }), `${slideId}.html`);
    return;
  }

  const { zipSync } = await import('fflate');
  const zipTree: Record<string, Uint8Array | Record<string, Uint8Array>> = {
    [`${slideId}.html`]: htmlBytes,
    assets: {},
  };
  for (const { name, bytes } of assets.values()) {
    (zipTree.assets as Record<string, Uint8Array>)[name] = bytes;
  }
  const zipped = zipSync(zipTree as Parameters<typeof zipSync>[0]);
  downloadBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), `${slideId}.zip`);
}

async function renderPagesToHtml(
  pages: NonNullable<SlideModule['default']>,
  activePage: boolean,
): Promise<string[]> {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  const result: string[] = [];
  try {
    for (let i = 0; i < pages.length; i++) {
      const Page = pages[i];
      if (!Page) continue;
      const host = document.createElement('div');
      host.style.width = `${CANVAS_WIDTH}px`;
      host.style.height = `${CANVAS_HEIGHT}px`;
      container.appendChild(host);
      const root = createRoot(host);
      const content = activePage
        ? createElement(
            StepHost,
            { isActivePage: true, entryDirection: 'jump', controllerRef: { current: null } },
            createElement(Page),
          )
        : createElement(Page);
      root.render(createElement(SlidePageProvider, { index: i, total: pages.length }, content));
      await nextFrame();
      await nextFrame();
      for (const video of host.querySelectorAll('video')) {
        video.defaultMuted = video.muted;
      }
      result.push(host.innerHTML);
      root.unmount();
      container.removeChild(host);
    }
  } finally {
    container.remove();
  }
  return result;
}

function collectCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      chunks.push(rule.cssText);
    }
  }
  return chunks.join('\n');
}

function collectExternalStylesheetLinks(): string {
  const links: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      void sheet.cssRules;
    } catch {
      if (sheet.href) {
        links.push(`<link rel="stylesheet" href="${escapeAttr(sheet.href)}">`);
      }
    }
  }
  return links.join('\n');
}

function findHtmlAssetUrls(html: string): string[] {
  const out: string[] = [];
  const attrRe = /\s(?:src|href|poster)="([^"]+)"/g;
  for (const m of html.matchAll(attrRe)) {
    if (looksLikeAsset(m[1])) out.push(m[1]);
  }
  const srcsetRe = /\ssrcset="([^"]+)"/g;
  for (const m of html.matchAll(srcsetRe)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url && looksLikeAsset(url)) out.push(url);
    }
  }
  return out;
}

function findCssAssetUrls(css: string): string[] {
  const out: string[] = [];
  const re = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
  for (const m of css.matchAll(re)) {
    const url = m[2].trim();
    if (looksLikeAsset(url)) out.push(url);
  }
  return out;
}

function looksLikeAsset(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) return false;
  if (url.startsWith('mailto:') || url.startsWith('javascript:')) return false;
  const abs = toAbsolute(url);
  if (!abs) return false;
  try {
    const u = new URL(abs);
    if (u.origin !== window.location.origin) return false;
  } catch {
    return false;
  }
  return ASSET_EXT_RE.test(url);
}

function toAbsolute(url: string): string | null {
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return null;
  }
}

function uniqueAssetName(absoluteUrl: string, used: Set<string>): string {
  let base: string;
  try {
    const u = new URL(absoluteUrl);
    base = u.pathname.split('/').pop() || 'asset';
  } catch {
    base = 'asset';
  }
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const hash = shortHash(absoluteUrl);
  const dot = base.lastIndexOf('.');
  const name = dot > 0 ? `${base.slice(0, dot)}-${hash}${base.slice(dot)}` : `${base}-${hash}`;
  used.add(name);
  return name;
}

function shortHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}

function rewriteUrls(
  source: string,
  assets: Map<string, AssetEntry>,
  kind: 'html' | 'css',
): string {
  let out = source;
  for (const [orig, { name }] of assets) {
    const replacement = kind === 'css' ? `./assets/${name}` : `assets/${name}`;
    out = out.split(orig).join(replacement);
  }
  return out;
}

function buildHtml(opts: {
  title: string;
  pagesHtml: string[];
  bundledCss: string;
  externalLinks: string;
  design: SlideModule['design'];
  transitions: Array<SlideTransition | undefined>;
}): string {
  const pagesMarkup = opts.pagesHtml
    .map(
      (page, i) => `<div class="os-page" data-idx="${i}"${i === 0 ? '' : ' hidden'}>${page}</div>`,
    )
    .join('');

  const frameStyle = opts.design
    ? Object.entries(designToCssVars(opts.design))
        .map(([k, v]) => `${k}: ${v};`)
        .join(' ')
    : '';

  const transitions = opts.transitions.map((transition) =>
    transition
      ? {
          duration: transition.duration,
          easing: transition.easing,
          enter: transition.enter,
          exit: transition.throughBackground ? transition.exit : holdOpacity(transition.exit),
        }
      : null,
  );
  const transitionData = JSON.stringify(transitions).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${opts.externalLinks}
<style>
html, body { margin: 0; height: 100%; background: #000; overflow: hidden; font-family: system-ui, sans-serif; }
.os-stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
.os-frame { width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px; flex-shrink: 0; background: var(--osd-bg, #fff); color: #000; transform-origin: center center; overflow: hidden; position: relative; }
.os-page { position: absolute; inset: 0; }
.os-page[hidden] { display: none !important; }
.os-counter { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); color: #fff; background: rgba(0,0,0,.5); padding: 2px 10px; border-radius: 999px; font-size: 12px; z-index: 10; font-variant-numeric: tabular-nums; }
</style>
<style>${opts.bundledCss}</style>
</head>
<body>
<div class="os-stage"><div class="os-frame" id="os-frame" data-osd-canvas${frameStyle ? ` style="${escapeAttr(frameStyle)}"` : ''}>${pagesMarkup}</div></div>
<div class="os-counter"><span id="os-cur">1</span> / <span id="os-total">${opts.pagesHtml.length}</span></div>
<script type="application/json" id="os-transitions">${transitionData}</script>
<script>
(function () {
  var pages = document.querySelectorAll('.os-page');
  var transitions = JSON.parse(document.getElementById('os-transitions').textContent);
  var idx = 0;
  var shown = 0;
  var animations = [];
  var run = 0;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var frame = document.getElementById('os-frame');
  var cur = document.getElementById('os-cur');
  function fit() {
    var s = Math.min(window.innerWidth / ${CANVAS_WIDTH}, window.innerHeight / ${CANVAS_HEIGHT});
    frame.style.transform = 'scale(' + s + ')';
  }
  function settle() {
    run++;
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];
    pages.forEach(function (p, n) {
      p.hidden = n !== idx;
      p.inert = n !== idx;
      p.setAttribute('aria-hidden', String(n !== idx));
      p.style.zIndex = '';
    });
  }
  function syncVideos() {
    pages.forEach(function (p, n) {
      p.querySelectorAll('video').forEach(function (video) {
        if (n !== idx) {
          video.pause();
          try { video.currentTime = 0; } catch {}
        } else if (video.autoplay) {
          video.play().catch(function () {});
        }
      });
    });
  }
  function phase(element, definition, transition) {
    if (!definition) return;
    var animation = element.animate(definition.keyframes, {
      duration: definition.duration ?? transition.duration,
      easing: definition.easing ?? transition.easing ?? 'cubic-bezier(.4, 0, .2, 1)',
      delay: definition.delay ?? 0,
      fill: 'both'
    });
    animation.finished.catch(function () {});
    animations.push(animation);
  }
  // Pages authored with <Steps>/<Step> render every step into the markup, so the file still
  // reads with scripting off. This walks them one keypress at a time, the way the player does:
  // arrive forward and the page starts unrevealed, arrive backward and it is already complete.
  function stepsOf(page) {
    return page ? page.querySelectorAll('[data-osd-step]') : [];
  }
  function setStep(el, revealed, animate) {
    var transition = el.style.transition;
    if (!animate || reducedMotion.matches) el.style.transition = 'none';
    el.setAttribute('data-osd-step', revealed ? 'revealed' : 'pending');
    el.style.opacity = revealed ? '1' : '0';
    el.style.visibility = revealed ? 'visible' : 'hidden';
    if (!animate || reducedMotion.matches) {
      void el.offsetWidth;
      el.style.transition = transition;
    }
  }
  function paintSteps(page, count, animate) {
    var els = stepsOf(page);
    for (var i = 0; i < els.length; i++) setStep(els[i], i < count, animate);
  }
  function go(i, revealAll) {
    var next = Math.max(0, Math.min(pages.length - 1, i));
    if (next === idx) {
      if (animations.length) settle();
      if (revealAll) shown = stepsOf(pages[idx]).length;
      paintSteps(pages[idx], shown, false);
      return;
    }
    settle();
    var previous = idx;
    idx = next;
    shown = revealAll || idx < previous ? stepsOf(pages[idx]).length : 0;
    var outgoing = pages[previous];
    var incoming = pages[idx];
    var transition = transitions[idx];
    frame.dataset.osdDir = idx > previous ? 'forward' : 'backward';
    frame.style.setProperty('--osd-dir', idx > previous ? '1' : '-1');
    paintSteps(incoming, shown, false);
    void incoming.offsetWidth;
    incoming.hidden = false;
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    incoming.style.zIndex = '1';
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    cur.textContent = String(idx + 1);
    syncVideos();
    if (reducedMotion.matches || !transition || !incoming.animate) {
      settle();
      return;
    }
    try {
      phase(outgoing, transition.exit, transition);
      phase(incoming, transition.enter, transition);
    } catch {
      settle();
      return;
    }
    if (animations.length === 0) {
      settle();
      return;
    }
    var currentRun = run;
    Promise.all(animations.map(function (animation) {
      return animation.finished.catch(function () {});
    })).then(function () {
      if (currentRun === run) settle();
    });
  }
  function next() {
    if (animations.length) settle();
    if (shown < stepsOf(pages[idx]).length) {
      shown += 1;
      paintSteps(pages[idx], shown, true);
      return;
    }
    go(idx + 1);
  }
  function prev() {
    if (animations.length) settle();
    if (shown > 0) {
      shown -= 1;
      paintSteps(pages[idx], shown, true);
      return;
    }
    go(idx - 1);
  }
  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) settle();
  });
  window.addEventListener('resize', fit);
  window.addEventListener('keydown', function (e) {
    if (['ArrowRight','ArrowDown','PageDown',' '].indexOf(e.key) >= 0) { e.preventDefault(); next(); }
    else if (['ArrowLeft','ArrowUp','PageUp'].indexOf(e.key) >= 0) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, true); }
    else if (e.key === 'End') { e.preventDefault(); go(pages.length - 1, true); }
  });
  fit();
  go(0);
  settle();
  syncVideos();
})();
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
