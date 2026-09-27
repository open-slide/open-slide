import { h } from '../lib/dom.js';
import { icon } from '../ui/icons.js';

const POLL_MS = 2500;
const renderCmd = (id) => `pnpm marketing render ${id}`;
const KINDS = {
  film: { label: 'Videos', icon: 'film', newCmd: 'pnpm marketing new:film <id> --feature "…"' },
  image: { label: 'Images', icon: 'image', newCmd: 'pnpm marketing new:image <id>' },
};

// `project` is null on the overview and undefined until the first route.
const state = { projects: [], project: undefined, renders: [], active: null, signature: '' };
const cards = new Map();

const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const fmtSize = (b) =>
  b >= 1e9
    ? `${(b / 1e9).toFixed(2)} GB`
    : b >= 1e6
      ? `${(b / 1e6).toFixed(1)} MB`
      : `${Math.max(1, Math.round(b / 1e3))} KB`;
const fileName = (id) => id.split('/').pop();
const resLabel = (height) => (height >= 2160 ? '4K' : height >= 1440 ? '1440p' : `${height}p`);
const isDraft = (r) => r.meta?.samples === 1 || /draft/.test(r.id);
const displayName = (r) =>
  r.meta?.name ?? fileName(r.id).replace(/(-\d{8}-\d{6})?\.(mp4|png)$/, '');
const sizes = (p) => p.outputs.map((o) => `${o.width}×${o.height}`).join(' · ');

// Poster at the film's `poster` second; partial renders (--from/--to) fall back to their midpoint.
function posterTime(r, project, duration = r.meta?.duration) {
  const t = (project.poster ?? 0) - (r.meta?.from ?? 0);
  if (duration && (t < 0 || t > duration)) return duration / 2;
  return t;
}

function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ms).toLocaleDateString();
}

function specs(r, media) {
  const m = r.meta ?? {};
  const width = m.width ?? media?.videoWidth ?? media?.naturalWidth;
  const height = m.height ?? media?.videoHeight ?? media?.naturalHeight;
  const duration = m.duration ?? (media?.duration || null);
  return { width, height, duration, fps: m.fps, samples: m.samples, git: m.git };
}

async function copy(text, el, label) {
  await navigator.clipboard?.writeText(text).catch(() => null);
  const prev = el.lastChild.textContent;
  el.lastChild.textContent = label;
  setTimeout(() => {
    el.lastChild.textContent = prev;
  }, 1200);
}

function cmdButton(getText) {
  const text = h('span');
  const el = h('button', { class: 'cmd', title: 'Copy command' }, h('b', { text: '$' }), text);
  el.onclick = () => copy(getText(), el, 'Copied to clipboard');
  return {
    el,
    set(s) {
      text.textContent = s;
    },
  };
}

function media(r, project) {
  if (project.kind === 'image') return h('img', { src: r.url, alt: '', decoding: 'async' });
  const video = h('video', { preload: 'metadata', playsinline: true });
  video.muted = true;
  video.src = `${r.url}#t=${posterTime(r, project).toFixed(2)}`;
  return video;
}

const go = (hash) => {
  location.hash = hash;
};

const navOverview = h(
  'button',
  { class: 'nav-row' },
  icon('layout-grid', { size: 16 }),
  'Overview',
  h('span', { class: 'count mono' }),
);
navOverview.onclick = () => go('#/');
const lists = Object.fromEntries(
  Object.keys(KINDS).map((kind) => [kind, h('div', { class: 'project-list' })]),
);

const side = h(
  'aside',
  { class: 'side' },
  h(
    'div',
    { class: 'brand' },
    h('img', { src: '/@repo/apps/web/public/open-slide.png', alt: '' }),
    h('b', { text: 'open-slide' }),
    h('span', { text: 'Marketing' }),
  ),
  navOverview,
  Object.entries(KINDS).map(([kind, k]) => [
    h('div', { class: 'eyebrow', text: k.label }),
    lists[kind],
  ]),
  h(
    'div',
    { class: 'side-foot' },
    h('span', { class: 'live-dot' }),
    h('span', { class: 'mono', text: 'watching out/' }),
  ),
);

const overviewSections = Object.entries(KINDS).map(([kind, k]) => {
  const newCmd = cmdButton(() => k.newCmd);
  newCmd.set(k.newCmd);
  const grid = h('div', { class: 'grid' });
  const el = h(
    'div',
    { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', { text: k.label }), newCmd.el),
    grid,
  );
  return { kind, el, grid };
});
const overviewView = h(
  'section',
  { class: 'view overview' },
  h(
    'div',
    { class: 'head' },
    icon('layout-grid', { size: 18 }),
    h('h1', { text: 'Workspace' }),
    h('span', { class: 'sub', text: 'Every video and image made for open-slide.' }),
  ),
  overviewSections.map((s) => s.el),
);

const headIcon = h('span', { class: 'head-icon' });
const heading = h('h1');
const count = h('span', { class: 'count mono' });
const tabRenders = h(
  'button',
  { class: 'tab', role: 'tab' },
  icon('layers', { size: 14 }),
  'Renders',
  count,
);
const tabPreview = h('button', { class: 'tab', role: 'tab' }, icon('eye', { size: 14 }), 'Preview');
tabRenders.onclick = () => go(`#/${state.project.id}/renders`);
tabPreview.onclick = () => go(`#/${state.project.id}/preview`);
const reload = h(
  'button',
  { class: 'icon-btn', title: 'Reload preview' },
  icon('rotate-cw', { size: 14 }),
);
reload.onclick = () => {
  for (const f of previewPane.querySelectorAll('iframe')) f.contentWindow?.location.reload();
};
const cmd = cmdButton(() => renderCmd(state.project.id));

const grid = h('div', { class: 'grid' });
const emptyCmd = h('code', { class: 'mono' });
const emptyIcon = h('span');
const empty = h(
  'div',
  { class: 'empty', hidden: true },
  emptyIcon,
  h('h2', { text: 'No renders yet' }),
  h('div', {}, 'Every render lands here with its settings. Start one with'),
  emptyCmd,
);
const rendersPane = h('div', { class: 'pane renders' }, empty, grid);
const previewPane = h('div', { class: 'pane preview', hidden: true });
let previewKey = null;

const projectView = h(
  'section',
  { class: 'view project', hidden: true },
  h(
    'div',
    { class: 'head' },
    headIcon,
    heading,
    h('div', { class: 'tabs', role: 'tablist' }, tabRenders, tabPreview),
    h('div', { class: 'head-actions' }, reload, cmd.el),
  ),
  rendersPane,
  previewPane,
);

const main = h('main', { class: 'main' }, overviewView, projectView);
document.getElementById('app').append(h('div', { class: 'shell' }, side, main));

function makeCard(r, project) {
  const isFilm = project.kind === 'film';
  const thumbMedia = media(r, project);
  const badges = h('div', { class: 'badges' });
  const timecode = h('div', { class: 'timecode mono' });
  const bar = h('i');
  const thumb = h(
    'div',
    { class: `thumb ${project.kind}` },
    thumbMedia,
    badges,
    isFilm && timecode,
    isFilm && h('div', { class: 'scrub' }, bar),
  );
  const title = h('span');
  const when = h('span', { class: 'ago' });
  const meta = h('div', { class: 'meta mono' });
  const el = h(
    'article',
    { class: 'render' },
    thumb,
    h('div', { class: 'info' }, h('div', { class: 'title' }, title, when), meta),
  );

  if (isFilm) {
    const video = thumbMedia;
    let pending = null;
    const seek = (t) => {
      if (video.seeking) pending = t;
      else video.currentTime = t;
    };
    video.addEventListener('seeked', () => {
      if (pending == null) return;
      const t = pending;
      pending = null;
      video.currentTime = t;
    });
    thumb.addEventListener('pointermove', (e) => {
      const box = thumb.getBoundingClientRect();
      const f = clamp01((e.clientX - box.left) / box.width);
      const d = video.duration;
      if (!Number.isFinite(d)) return;
      seek(f * d);
      bar.style.width = `${f * 100}%`;
      timecode.textContent = `${fmtTime(f * d)} / ${fmtTime(d)}`;
    });
    thumb.addEventListener('pointerleave', () => {
      if (Number.isFinite(video.duration)) seek(posterTime(r, project, video.duration));
      bar.style.width = '0';
    });
  }

  const card = {
    el,
    media: thumbMedia,
    update(render, latest) {
      card.render = render;
      card.latest = latest;
      const s = specs(render, thumbMedia);
      const m = render.meta ?? {};
      title.textContent = displayName(render);
      title.title = fileName(render.id);
      when.textContent = ago(render.mtime);
      badges.replaceChildren(
        ...(latest ? [h('span', { class: 'badge brand', text: 'Latest' })] : []),
        ...(isFilm && s.height ? [h('span', { class: 'badge', text: resLabel(s.height) })] : []),
        ...(isFilm && isDraft(render) ? [h('span', { class: 'badge', text: 'Draft' })] : []),
        ...(!isFilm && m.scale > 1 ? [h('span', { class: 'badge', text: `@${m.scale}x` })] : []),
        ...(!isFilm && m.publish ? [h('span', { class: 'badge', text: 'Published' })] : []),
      );
      const parts = [
        s.width ? `${s.width}×${s.height}` : null,
        s.fps ? `${s.fps}fps` : null,
        isFilm && s.duration ? fmtTime(s.duration) : null,
        fmtSize(render.size),
      ].filter(Boolean);
      meta.replaceChildren(
        parts.join(' · '),
        ...(s.git
          ? [
              ` · ${s.git.commit}`,
              ...(s.git.dirty ? [h('span', { class: 'dirty', text: '*' })] : []),
            ]
          : []),
      );
    },
  };
  thumbMedia.addEventListener(isFilm ? 'loadedmetadata' : 'load', () =>
    card.update(card.render, card.latest),
  );
  el.addEventListener('click', () => {
    go(`#/${project.id}/renders/${encodeURIComponent(r.id)}`);
  });
  return card;
}

const progress = (() => {
  const pct = h('div', { class: 'pct mono' });
  const fill = h('i');
  const title = h('span');
  const meta = h('div', { class: 'meta mono' });
  const el = h(
    'article',
    { class: 'render rendering' },
    h('div', { class: 'thumb' }, pct, h('div', { class: 'bar' }, fill)),
    h(
      'div',
      { class: 'info' },
      h('div', { class: 'title' }, title, h('span', { class: 'ago', text: 'rendering' })),
      meta,
    ),
  );
  return {
    el,
    update(a) {
      const p = a.total ? a.frames / a.total : 0;
      pct.textContent = `${Math.floor(p * 100)}%`;
      fill.style.width = `${p * 100}%`;
      title.textContent = a.name.replace(/(-\d{8}-\d{6})?\.(mp4|png)$/, '');
      const unit = a.unit ?? 'frames';
      const rate = Number.isFinite(a.fps) ? ` · ${a.fps.toFixed(1)} fps` : '';
      const eta =
        unit === 'frames'
          ? ` · ${Number.isFinite(a.eta) ? `eta ${fmtTime(a.eta)}` : 'starting'}`
          : '';
      meta.textContent = `${a.width}×${a.height} · ${a.frames}/${a.total} ${unit}${rate}${eta}`;
    },
  };
})();

// Films mark their newest render; images mark the newest render of each output.
function latestIds(project, renders) {
  if (project.kind === 'film') return new Set(renders.slice(0, 1).map((r) => r.id));
  const seen = new Map();
  for (const r of renders) if (!seen.has(displayName(r))) seen.set(displayName(r), r.id);
  return new Set(seen.values());
}

function clearCards() {
  for (const card of cards.values()) {
    card.media.removeAttribute('src');
    card.el.remove();
  }
  cards.clear();
}

function renderGrid() {
  const { project, renders, active } = state;
  count.textContent = String(renders.length).padStart(2, '0');
  empty.hidden = renders.length > 0 || !!active;

  const latest = latestIds(project, renders);
  const seen = new Set();
  const order = [];
  if (active) {
    progress.update(active);
    order.push(progress.el);
  }
  renders.forEach((r, i) => {
    let card = cards.get(r.id);
    if (!card) {
      card = makeCard(r, project);
      card.el.style.animationDelay = `${Math.min(i, 11) * 30}ms`;
      cards.set(r.id, card);
    }
    card.update(r, latest.has(r.id));
    seen.add(r.id);
    order.push(card.el);
  });
  for (const [id, card] of cards) {
    if (!seen.has(id)) {
      card.media.removeAttribute('src');
      card.el.remove();
      cards.delete(id);
    }
  }
  order.forEach((el, i) => {
    if (grid.children[i] !== el) grid.insertBefore(el, grid.children[i] ?? null);
  });
  while (grid.children.length > order.length) grid.lastChild.remove();
}

function projectCard(p, { renders, active }) {
  const latest = renders[0];
  const thumb = h(
    'div',
    { class: `thumb ${p.kind}` },
    latest
      ? media(latest, p)
      : h('div', { class: 'placeholder' }, icon(KINDS[p.kind].icon, { size: 22, stroke: 1.5 })),
    active && h('div', { class: 'badges' }, h('span', { class: 'badge brand', text: 'Rendering' })),
  );
  const facts = [
    `${renders.length} ${renders.length === 1 ? 'render' : 'renders'}`,
    p.kind === 'film' && p.duration ? fmtTime(p.duration) : null,
    p.kind === 'image' && p.outputs ? sizes(p) : null,
  ].filter(Boolean);
  const el = h(
    'article',
    { class: 'render' },
    thumb,
    h(
      'div',
      { class: 'info' },
      h(
        'div',
        { class: 'title' },
        h('span', { text: p.title }),
        h('span', { class: 'ago', text: latest ? ago(latest.mtime) : 'No renders yet' }),
      ),
      h('div', { class: 'meta mono', text: facts.join(' · ') }),
    ),
  );
  el.onclick = () => go(`#/${p.id}/renders`);
  return el;
}

const fetchRenders = (id) =>
  fetch(`/api/projects/${id}/renders`, { cache: 'no-store' }).then((res) => res.json());

async function refresh() {
  try {
    if (!state.project) {
      const all = await Promise.all(state.projects.map((p) => fetchRenders(p.id)));
      const signature = JSON.stringify(
        all.map((d) => [d.renders[0]?.id, d.renders.length, !!d.active]),
      );
      if (signature === state.signature) return;
      state.signature = signature;
      const total = all.reduce((n, d) => n + d.renders.length, 0);
      navOverview.querySelector('.count').textContent = String(total).padStart(2, '0');
      for (const section of overviewSections) {
        const cardsFor = state.projects
          .map((p, i) => [p, all[i]])
          .filter(([p]) => p.kind === section.kind)
          .map(([p, d]) => projectCard(p, d));
        for (const v of section.grid.querySelectorAll('video')) v.removeAttribute('src');
        section.grid.replaceChildren(
          ...(cardsFor.length
            ? cardsFor
            : [
                h('div', {
                  class: 'none',
                  text: `No ${KINDS[section.kind].label.toLowerCase()} yet.`,
                }),
              ]),
        );
      }
      return;
    }
    const project = state.project;
    const data = await fetchRenders(project.id);
    if (state.project !== project) return;
    const signature = JSON.stringify([data.renders.map((r) => [r.id, r.mtime]), data.active]);
    if (signature === state.signature) return;
    state.signature = signature;
    state.renders = data.renders;
    state.active = data.active;
    renderGrid();
    if (currentRoute().render) route();
  } catch {}
}

const playerVideo = h('video', { controls: true, playsinline: true });
const playerImage = h('img', { alt: '' });
const screen = h('div', { class: 'screen' });
const details = h('aside', { class: 'details' });
const player = h('div', { class: 'player', hidden: true }, screen, details);
player.addEventListener('click', (e) => {
  if (e.target === player || e.target === screen) go(`#/${state.project.id}/renders`);
});
document.body.append(player);

function fact(label, value) {
  return [h('dt', { text: label }), h('dd', { text: value ?? '—' })];
}

function filmFacts(s, m) {
  return [
    ...fact('Resolution', s.width ? `${s.width} × ${s.height}` : null),
    ...fact('Frame rate', s.fps ? `${s.fps} fps` : null),
    ...fact(
      'Duration',
      s.duration ? `${fmtTime(s.duration)}.${pad(Math.round((s.duration % 1) * 100))}` : null,
    ),
    ...fact(
      'Motion blur',
      m.samples
        ? m.samples > 1
          ? `${m.samples} samples · ${Math.round(m.shutter * 360)}°`
          : 'Off'
        : null,
    ),
    ...fact('Encode', m.crf != null ? `CRF ${m.crf} · grain ${m.grain}` : null),
    ...fact('Audio', m.audio == null ? null : m.audio ? 'Soundtrack' : 'None'),
  ];
}

function imageFacts(s, m) {
  return [
    ...fact('Resolution', s.width ? `${s.width} × ${s.height}` : null),
    ...fact('Scale', m.scale ? `${m.scale}×` : null),
    ...fact('Published to', m.publish),
  ];
}

function showPlayer(r) {
  const isFilm = state.project.kind === 'film';
  const current = isFilm ? playerVideo : playerImage;
  const s = specs(r, cards.get(r.id)?.media);
  const m = r.meta ?? {};
  if (current.dataset.id !== r.id) {
    current.dataset.id = r.id;
    current.src = r.url;
    if (isFilm) playerVideo.play().catch(() => null);
  }
  if (screen.firstChild !== current) screen.replaceChildren(current);
  const created = new Date(r.mtime);
  const close = h('button', { class: 'nav-row', title: 'Close (Esc)' }, icon('x', { size: 16 }));
  close.onclick = () => go(`#/${state.project.id}/renders`);
  const download = h(
    'a',
    { class: 'btn primary', href: r.url, download: fileName(r.id) },
    icon('download', { size: 14 }),
    'Download',
  );
  const copyPath = h(
    'button',
    { class: 'btn' },
    icon('copy', { size: 14 }),
    h('span', { text: 'Copy path' }),
  );
  copyPath.onclick = () => copy(`apps/marketing/${r.id}`, copyPath, 'Copied');
  details.replaceChildren(
    h(
      'div',
      { style: 'display:flex;gap:10px;align-items:flex-start' },
      h(
        'div',
        { style: 'flex:1;min-width:0' },
        h('h2', { text: displayName(r) }),
        h('div', { class: 'sub', text: `${created.toLocaleString()} · ${ago(created.getTime())}` }),
      ),
      close,
    ),
    h(
      'dl',
      { class: 'facts' },
      ...(isFilm ? filmFacts(s, m) : imageFacts(s, m)),
      ...fact('Render time', m.renderSeconds != null ? fmtTime(m.renderSeconds) : null),
      ...fact('Commit', m.git ? `${m.git.commit}${m.git.dirty ? ' · modified' : ''}` : null),
      ...fact('Size', fmtSize(r.size)),
    ),
    h('div', { class: 'meta mono', text: r.id, title: r.id }),
    h('div', { class: 'actions' }, download, copyPath),
    h(
      'div',
      { class: 'keys mono' },
      h('span', { text: '← → switch' }),
      isFilm && h('span', { text: 'space play' }),
      h('span', { text: 'esc close' }),
    ),
  );
  player.hidden = false;
}

function hidePlayer() {
  if (player.hidden) return;
  player.hidden = true;
  playerVideo.pause();
  for (const el of [playerVideo, playerImage]) {
    el.removeAttribute('src');
    el.dataset.id = '';
  }
  playerVideo.load();
}

const fit = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    const frame = target.firstChild;
    frame.style.transform = `scale(${contentRect.width / Number(frame.dataset.width)})`;
  }
});

function canvas(p, o) {
  const frame = h('iframe', {
    src: `/images/${p.id}/${p.page}`,
    title: `${p.title} · ${o.name}`,
    'data-width': o.width,
    style: `width:${o.width}px;height:${o.height}px`,
  });
  const box = h('div', { class: 'canvas', style: `aspect-ratio:${o.width}/${o.height}` }, frame);
  fit.observe(box);
  return h(
    'figure',
    {},
    h(
      'figcaption',
      { class: 'mono' },
      h('b', { text: o.name }),
      `${o.width} × ${o.height}`,
      o.publish && h('span', { class: 'publish', text: `→ ${o.publish}` }),
    ),
    box,
  );
}

function mountPreview(p) {
  if (previewKey === p.id) return;
  previewKey = p.id;
  fit.disconnect();
  previewPane.replaceChildren(
    p.kind === 'film'
      ? h('iframe', { src: `/film.html?film=${p.id}&t=${p.poster}`, title: 'Composition preview' })
      : h(
          'div',
          { class: 'canvases' },
          p.outputs.map((o) => canvas(p, o)),
        ),
  );
}

function currentRoute() {
  const [, id = '', view = 'renders', render] = location.hash.split('/');
  return { id, view, render: render ? decodeURIComponent(render) : null };
}

function selectProject(project) {
  state.project = project;
  state.renders = [];
  state.active = null;
  state.signature = '';
  clearCards();
  fit.disconnect();
  previewPane.replaceChildren();
  previewKey = null;
  grid.replaceChildren();
  empty.hidden = true;
  if (project) {
    headIcon.replaceChildren(icon(KINDS[project.kind].icon, { size: 18 }));
    heading.textContent = project.title;
    cmd.set(renderCmd(project.id));
    emptyCmd.textContent = renderCmd(project.id);
    emptyIcon.replaceChildren(icon(KINDS[project.kind].icon, { size: 28, stroke: 1.5 }));
  }
  document.title = `${project ? `${project.title} — ` : ''}open-slide marketing`;
  for (const list of Object.values(lists)) {
    for (const row of list.children) {
      row.setAttribute('aria-current', row.dataset.id === project?.id ? 'page' : 'false');
    }
  }
  navOverview.setAttribute('aria-current', project ? 'false' : 'page');
  refresh();
}

function route() {
  const { id, view, render } = currentRoute();
  const project = state.projects.find((p) => p.id === id) ?? null;
  if (id && !project) return location.replace('#/');
  if (view === 'composition') return location.replace(`#/${id}/preview`);
  if (state.project !== project) selectProject(project);
  overviewView.hidden = !!project;
  projectView.hidden = !project;
  if (!project) return hidePlayer();

  const isPreview = view === 'preview';
  rendersPane.hidden = isPreview;
  previewPane.hidden = !isPreview;
  reload.hidden = !isPreview;
  tabRenders.setAttribute('aria-selected', String(!isPreview));
  tabPreview.setAttribute('aria-selected', String(isPreview));
  if (isPreview) mountPreview(project);
  const r = render && state.renders.find((x) => x.id === render);
  if (r) showPlayer(r);
  else hidePlayer();
}

addEventListener('hashchange', route);
addEventListener('keydown', (e) => {
  if (player.hidden) return;
  if (e.key === 'Escape') go(`#/${state.project.id}/renders`);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const { render } = currentRoute();
    const i = state.renders.findIndex((r) => r.id === render);
    const next = state.renders[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (next) go(`#/${state.project.id}/renders/${encodeURIComponent(next.id)}`);
  }
});

// A manifest that fails to import (mid-edit, say) still gets a row, titled by its id.
async function loadProjects() {
  const list = await (await fetch('/api/projects', { cache: 'no-store' })).json();
  return Promise.all(
    list.map(async ({ id, kind }) => {
      try {
        const path = kind === 'film' ? `/films/${id}/film.js` : `/images/${id}/image.js`;
        const { default: spec } = await import(path);
        return { ...spec, id, kind };
      } catch (e) {
        console.error(e);
        return { id, kind, title: id, poster: 0, page: 'index.html', outputs: [] };
      }
    }),
  );
}

state.projects = await loadProjects();
for (const [kind, list] of Object.entries(lists)) {
  const rows = state.projects
    .filter((p) => p.kind === kind)
    .map((p) => {
      const row = h(
        'button',
        { class: 'project-row', 'data-id': p.id },
        icon(KINDS[kind].icon, { size: 14 }),
        h('span', { text: p.title }),
      );
      row.onclick = () => go(`#/${p.id}/renders`);
      return row;
    });
  list.replaceChildren(...(rows.length ? rows : [h('div', { class: 'none', text: 'None yet' })]));
}
route();
setInterval(() => {
  if (!document.hidden) refresh();
}, POLL_MS);
