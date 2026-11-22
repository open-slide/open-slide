// Working recipes for every dev-UI state shot so far. Copy the ones you need
// into a shots file in your scratchpad and adjust crops.
//
// Shot fields:
//   name       output file name (<name>.webp)
//   viewport   { width, height } in CSS px. 1280×720 for editor shots (the
//              canvas fills the frame), 1280×800 for home/themes/full views.
//   crop       { x, y, w, h } in CSS px of the viewport. Omit for the full
//              window. Edges touching the viewport get padding, inner edges
//              bleed. Keep w ≥ ~900 so UI text stays legible in a docs column.
//   stage      'light' (default) or 'dark' for dark UIs like the presenter.
//   init       function run in the page before load (localStorage seeding).
//   routes     async (context) => {} to mock network routes.
//   setup      async ({ page, context, openSlide }) => {}; may return another
//              page (a popup) to shoot instead.
//   beforeShot async ({ page }) => {} right before the capture (hover etc.).

const canvas = (page) => page.locator('main[data-inspector-root]');
const EDITOR = { width: 1280, height: 720 };
const DECK = 'fieldwork-fy27-plan';

const iso = (secondsAgo) => new Date(Date.now() - secondsAgo * 1000).toISOString();

// The agent panel needs a connected agent and a transcript, which a scratch
// server doesn't have, so the session is mocked. Responses are delayed: if a
// running session is known before the deck finishes loading, the editor's
// follow-along logic jumps to the last page.
const agentSession = {
  id: 's-docs-1',
  provider: 'claude',
  title: 'Warm up the cover',
  createdAt: iso(90),
  updatedAt: iso(2),
  status: 'running',
  slideId: DECK,
  providerSessionId: 'docs',
  items: [
    {
      kind: 'user',
      id: 'u1',
      ts: iso(90),
      text: 'Make the cover feel warmer — put the accent on “operating” and give the illustration more room.',
    },
    {
      kind: 'tool',
      id: 't1',
      ts: iso(80),
      name: 'Skill',
      title: 'Skill',
      detail: 'current-slide',
      status: 'done',
    },
    {
      kind: 'tool',
      id: 't2',
      ts: iso(70),
      name: 'Read',
      title: 'Read',
      detail: `slides/${DECK}/index.tsx`,
      status: 'done',
    },
    {
      kind: 'assistant',
      id: 'a1',
      ts: iso(40),
      streaming: false,
      text: 'The headline is the `<h1>` on page 1. I’ll colour **operating** with the deck accent (`#E8553B`) and widen the illustration column from 520 to 600 px so the van has room to breathe.',
    },
    {
      kind: 'tool',
      id: 't3',
      ts: iso(4),
      name: 'Edit',
      title: 'Edit',
      detail: `slides/${DECK}/index.tsx`,
      status: 'running',
    },
  ],
};

async function agentRoutes(context) {
  const { providerSessionId: _p, items: _i, ...summary } = agentSession;
  const late = () => new Promise((r) => setTimeout(r, 4000));
  await context.route('**/__agent/sessions', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await late();
    await route.fulfill({ json: { sessions: [summary] } });
  });
  await context.route(`**/__agent/sessions/${agentSession.id}`, async (route) => {
    await late();
    await route.fulfill({ json: agentSession });
  });
  await context.route('**/__agent/events', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: ': ok\n\n',
    }),
  );
}

export default [
  {
    name: 'editor',
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await canvas(page).getByText('operating').first().click();
    },
  },
  {
    name: 'home',
    crop: { x: 0, y: 0, w: 1280, h: 680 },
    async setup({ page }) {
      await page.goto('/');
      await page.getByText('Getting started').first().waitFor();
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'inspector',
    viewport: EDITOR,
    crop: { x: 300, y: 0, w: 980, h: 600 },
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await canvas(page).getByText('operating').first().click();
    },
  },
  {
    name: 'inspector-arrange',
    viewport: EDITOR,
    crop: { x: 300, y: 0, w: 980, h: 600 },
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await canvas(page).getByText('operating').first().click();
      await page.getByTitle('Arrange').click();
    },
  },
  {
    // Posting writes @slide-comment markers into the scratch deck, so later
    // shots in the same run show a comment badge on the toolbar.
    name: 'comment-mode',
    viewport: EDITOR,
    crop: { x: 305, y: 0, w: 975, h: 600 },
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await page.getByRole('button', { name: 'Comment', exact: true }).click();
      await canvas(page).getByText('operating').first().click();
      await page.keyboard.type('Use the accent colour on “operating”');
      await page.keyboard.press('Meta+Enter');
      await page.waitForTimeout(1500);
      await canvas(page).getByText('who does what').first().click();
      await page.keyboard.type('Shorten to one line');
      await page.keyboard.press('Meta+Enter');
      await page.waitForTimeout(1500);
      await canvas(page).getByText('All-hands and board').first().click();
      await page.keyboard.type('Add the meeting room');
    },
  },
  {
    name: 'image-placeholder',
    viewport: EDITOR,
    crop: { x: 300, y: 0, w: 980, h: 600 },
    async setup({ page, openSlide }) {
      await openSlide('q2-launch');
      await canvas(page).getByText('Product dashboard screenshot').first().click();
    },
  },
  {
    name: 'export-menu',
    viewport: EDITOR,
    crop: { x: 330, y: 0, w: 950, h: 560 },
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await page.getByRole('button', { name: 'Download' }).click();
      await page.getByText('Export as PDF').waitFor();
    },
    async beforeShot({ page }) {
      await page.getByText('Export as PDF').hover();
    },
  },
  {
    name: 'assets-manager',
    viewport: EDITOR,
    crop: { x: 0, y: 0, w: 1280, h: 560 },
    async setup({ page, openSlide }) {
      await openSlide(DECK);
      await page.getByRole('tab', { name: 'Assets' }).click();
      await page.getByText('route-map.jpg').waitFor();
      await page.getByRole('button', { name: 'List view' }).click();
    },
  },
  {
    // Needs network access to svgl.app. Pick a colourful brand: monochrome
    // logos like Vercel render as an empty light tile.
    name: 'svgl',
    viewport: EDITOR,
    crop: { x: 0, y: 0, w: 1100, h: 720 },
    async setup({ page, openSlide }) {
      await openSlide(DECK);
      await page.getByRole('tab', { name: 'Assets' }).click();
      await page.getByRole('button', { name: 'Search logos' }).click();
      await page.getByPlaceholder('Search by brand…').fill('figma');
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'themes',
    crop: { x: 0, y: 0, w: 1280, h: 620 },
    async setup({ page }) {
      await page.goto('/themes/pommi');
      await page.getByText('Back to themes').waitFor();
      await page.waitForTimeout(1500);
    },
  },
  {
    // Opened with no query: fuzzy search pulls unrelated "Language: …" rows.
    name: 'command-menu',
    crop: { x: 90, y: 0, w: 1100, h: 660 },
    async setup({ page }) {
      await page.goto('/');
      await page.getByText('Getting started').first().waitFor();
      await page.waitForTimeout(1500);
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'slide-overview',
    async setup({ page, openSlide }) {
      await openSlide(DECK);
      await page.keyboard.press('o');
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'agent-panel',
    viewport: EDITOR,
    crop: { x: 300, y: 0, w: 980, h: 600 },
    init: () => {
      localStorage.setItem('open-slide:agent-session', 's-docs-1');
      localStorage.setItem('open-slide:agent-dock', '1');
    },
    routes: agentRoutes,
    async setup({ page, openSlide }) {
      await openSlide(DECK, '?p=1');
      await page.waitForTimeout(5000);
    },
  },
  {
    // Opened from the Present menu so it is linked to the main window.
    name: 'presenter',
    stage: 'dark',
    viewport: { width: 1280, height: 760 },
    async setup({ page, context, openSlide }) {
      await openSlide(DECK, '?p=1');
      const popup = context.waitForEvent('page');
      await page.getByRole('button', { name: 'Present options' }).click();
      await page.getByText('Presenter mode').click();
      const presenter = await popup;
      await presenter.setViewportSize({ width: 1280, height: 760 });
      await presenter.waitForLoadState();
      await presenter.waitForTimeout(2500);
      return presenter;
    },
  },
];
