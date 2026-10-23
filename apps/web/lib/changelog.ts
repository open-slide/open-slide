export type ReleaseKind = 'major' | 'feature' | 'polish' | 'origin';

export type Shot = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Patch = {
  version: string;
  date: string;
  note: string;
};

export type Release = {
  line: string;
  version: string;
  date: string;
  kind: ReleaseKind;
  title: string;
  summary?: string;
  highlights?: string[];
  shot?: Shot;
  docs?: { label: string; href: string };
  callout?: { text: string; label: string; href: string };
  patches?: Patch[];
  contributors?: string[];
};

export type Era = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  span: string;
  releases: Release[];
};

const shot = (name: string, height: number, alt: string): Shot => ({
  src: `/assets/changelog/${name}.webp`,
  width: 2000,
  height,
  alt,
});

export const eras: Era[] = [
  {
    id: 'v2',
    label: 'v2',
    title: 'open-slide 2',
    blurb: 'React 19, an editor that edits, and an agent that lives next to your slides.',
    span: 'Sep – Oct 2026',
    releases: [
      {
        line: '2.3',
        version: '2.3.0',
        date: '2026-10-23',
        kind: 'feature',
        title: 'An agent panel, right next to your slides',
        summary:
          'Connect the Claude Code or Codex CLI you already use and the whole authoring loop moves into the browser: draft a deck, answer the scoping questions, apply comments, or change the page you are looking at. Every step streams in while the slide frame glows in the agent’s colours.',
        highlights: [
          'Draft a new deck page by page with `create-slide`, with the canvas following each page as it lands.',
          'Apply every pending comment with one click from the comment bar.',
          'Reuses your existing CLI login. The SDK installs into the workspace the first time you open the panel.',
          'Present mode keeps its letterbox bars black on screens that aren’t 16:9.',
        ],
        shot: shot(
          'agent-panel',
          1268,
          'The agent panel beside the canvas while Claude Code edits the open deck',
        ),
        docs: { label: 'Agent panel docs', href: '/docs/core-feature/agent' },
        patches: [
          {
            version: '2.3.1',
            date: '2026-10-23',
            note: 'The agent modules now ship with the package, so `open-slide dev` no longer fails to resolve `agent/types`.',
          },
        ],
      },
      {
        line: '2.2',
        version: '2.2.0',
        date: '2026-10-13',
        kind: 'feature',
        title: 'Comment mode',
        summary:
          'Comments moved out of the Format panel and into a mode of their own. Press `C`, click an element or drag across a region, and write the note in a floating composer. Every pending note sits as a pin beside the thing it is about.',
        highlights: [
          'Drag a box to comment on an area instead of a single element.',
          'Pins stay on the canvas, so a note can be edited or deleted in place.',
          'A badge on the toolbar counts the notes waiting for your agent.',
        ],
        shot: shot(
          'comment-mode',
          1274,
          'Comment mode with two pinned notes and a third being written beside the slide footer',
        ),
        docs: { label: 'Comments docs', href: '/docs/core-feature/inspector#comments' },
      },
      {
        line: '2.1',
        version: '2.1.0',
        date: '2026-10-09',
        kind: 'polish',
        title: 'A preview route, Spanish, and smarter undo',
        highlights: [
          'A dev-only `/s/<id>/preview?p=N` route renders a single page without editor chrome, and the bundled skills screenshot it to check their own work.',
          'The interface now speaks Spanish.',
          'Undo and redo jump back to the page where the edit happened and reselect what changed.',
          'Arrow keys move between focused slide thumbnails.',
          'A new open-slide mark in the favicon and sidebar.',
          'Toolbar titles and actions stay reachable in narrow windows.',
          'Duplicating a slide no longer creates a folder that differs only by letter case.',
        ],
        contributors: ['diegoctal', 'gonzalovargas', 'stantheman0128'],
      },
      {
        line: '2.0',
        version: '2.0.0',
        date: '2026-09-26',
        kind: 'major',
        title: 'open-slide 2.0',
        summary:
          'A new toolchain and an editor that actually edits. Decks now run on React 19, Vite 8, and TypeScript 7, and the inspector grew into a visual editor: drag, resize, rotate, align, and layer elements against smart guides, then format text right on the canvas.',
        highlights: [
          'Visual editing with snapping, safe resizing, layer ordering, and undo and save recovery you can trust.',
          'Double-click any text to edit it inline, with a floating toolbar for size, weight, colour, and alignment.',
          'Export as PPTX now writes native, editable text boxes, shapes, and images, all built in the browser.',
          'Search Google Fonts from the assets panel and download the weight you pick straight into the deck.',
          'Speaker notes render as Markdown in presenter view.',
          'A redesigned shell with inset content cards, a search field in the sidebar, and calmer page headers.',
          'New terminal output for `init`, `dev`, `build`, and `preview`, and new workspaces no longer need a `vite` devDependency.',
          'HTML exports reveal `<Steps>` one at a time, the way the player does.',
        ],
        shot: shot(
          'visual-editor',
          1334,
          'The visual editor with a headline selected and the Arrange tab open',
        ),
        callout: {
          text: 'Coming from v1? The upgrade takes a few minutes.',
          label: 'Migration guide',
          href: '/docs/migrate-to-v2',
        },
        patches: [
          {
            version: '2.0.1',
            date: '2026-09-27',
            note: 'The Vite conflict error points at the leftover `vite` entry and prints the exact command to remove it.',
          },
        ],
        contributors: ['ridemountainpig', 'peelar', 'dadofsambonzuki', 'benben6515'],
      },
    ],
  },
  {
    id: 'v1',
    label: 'v1',
    title: 'open-slide 1',
    blurb:
      'From a canvas and a skill file to themes, transitions, a real presenter, and a command menu.',
    span: 'May – Aug 2026',
    releases: [
      {
        line: '1.19',
        version: '1.19.0',
        date: '2026-08-20',
        kind: 'feature',
        title: 'Switch decks without leaving the stage',
        summary:
          'The presenter window can switch to another deck mid-talk. The projection follows along, and fullscreen and the timer keep running.',
        highlights: [
          '`allowedHosts` in `open-slide.config.ts` lets proxied domains like Codespaces and Coder reach the dev and preview servers.',
          'HTML exports keep video posters and mute state, autoplay only the visible page, and reset videos on hidden ones.',
        ],
        shot: shot(
          'presenter',
          1278,
          'Presenter view with the current slide, the next slide, speaker notes, and the timer',
        ),
        docs: { label: 'Present mode docs', href: '/docs/core-feature/present-mode' },
        patches: [
          {
            version: '1.19.1',
            date: '2026-08-22',
            note: 'One motion curve everywhere, press feedback across controls, flick-to-swipe in present mode, and no more flash on boot in dark mode.',
          },
        ],
        contributors: ['ridemountainpig', 'sunnyyoung'],
      },
      {
        line: '1.18',
        version: '1.18.0',
        date: '2026-08-11',
        kind: 'feature',
        title: 'Press ⌘K',
        summary:
          'A command menu for everything: search decks, jump to a page, or run a slide action without reaching for the mouse.',
        highlights: [
          'A Playwright end-to-end suite now covers the viewer, present mode, presenter sync, inspector editing, the dev API, and static builds.',
        ],
        shot: shot('command-menu', 1312, 'The ⌘K command menu open over the slide list'),
      },
      {
        line: '1.17',
        version: '1.17.0',
        date: '2026-07-20',
        kind: 'polish',
        title: 'A first pass at React 19',
        summary:
          'Workspaces moved to React 19 and Vite 8, then 1.17.1 restored React 18 and Vite 5 compatibility for projects that weren’t ready. The full upgrade landed with 2.0.',
        patches: [
          {
            version: '1.17.1',
            date: '2026-07-20',
            note: 'React 18 and Vite 5 work again for existing and newly generated projects.',
          },
        ],
      },
      {
        line: '1.16',
        version: '1.16.0',
        date: '2026-07-18',
        kind: 'feature',
        title: 'MorphElement is stable',
        summary:
          'Shared-element transitions graduated from `unstable_SharedElement` to `MorphElement`, and the transition option is now simply `morph`.',
        highlights: [
          '`useIsActivePage()` lets a page play its entrance only on the live, audience-facing copy.',
          'Morphs interpolate background, border, and outline colours instead of snapping at the end of the glide.',
          'The slide-authoring skill is split into one reference file per primitive.',
        ],
        docs: { label: 'MorphElement docs', href: '/docs/primitive/morph-element' },
      },
      {
        line: '1.15',
        version: '1.15.0',
        date: '2026-07-12',
        kind: 'polish',
        title: 'Base UI and a quieter palette',
        summary:
          'The internal UI moved from Radix to Base UI, and the app was retoned to flat, neutral grays with crisper labels.',
        highlights: [
          'The Assets sidebar entry is hidden in production builds, where it can’t do anything.',
        ],
        patches: [
          {
            version: '1.15.1',
            date: '2026-07-12',
            note: 'The dev server no longer throws a missing `useSyncExternalStore` export.',
          },
          {
            version: '1.15.2',
            date: '2026-07-12',
            note: 'The same fix, made to hold under pnpm.',
          },
          {
            version: '1.15.3',
            date: '2026-07-14',
            note: 'Adjustable speaker-notes text size, notes that save without remounting the canvas, and a clear warning for folders with non-ASCII names.',
          },
        ],
        contributors: ['ridemountainpig', 'mvanhorn', 'Yacolate0519-cmd'],
      },
      {
        line: '1.14',
        version: '1.14.0',
        date: '2026-07-11',
        kind: 'feature',
        title: 'A proper assets manager',
        summary:
          'Search, sort, and filter assets by usage and file type, switch between a resizable grid and a list, and see when each file was added or changed.',
        highlights: [
          'After an in-app update, the sidebar tooltip can restart the dev server for you.',
          'An edge control brings you back to the current slide when its thumbnail scrolls out of view.',
        ],
        shot: shot(
          'assets-manager',
          1138,
          'The assets manager in list view with file types, sizes, and usage status',
        ),
        docs: { label: 'Assets manager docs', href: '/docs/core-feature/assets-manager' },
      },
      {
        line: '1.13',
        version: '1.13.0',
        date: '2026-06-27',
        kind: 'feature',
        title: 'Shared elements, and present mode on your phone',
        summary:
          '`unstable_SharedElement` brought Keynote-style continuity between pages, and present mode became comfortable on phones with single-tap playback and controls that hide themselves.',
        highlights: [
          'Speaker notes stay attached to the right page when pages are deleted or duplicated.',
        ],
        patches: [
          {
            version: '1.13.1',
            date: '2026-06-27',
            note: 'A virtualized thumbnail rail for large decks, and shared-element borders that keep their width while resizing.',
          },
          {
            version: '1.13.2',
            date: '2026-06-28',
            note: 'The horizontal thumbnail rail is virtualized too.',
          },
          {
            version: '1.13.3',
            date: '2026-07-05',
            note: 'An all-slides view as the home page, Draft moved into the sidebar, and a mobile home with a menu and folder picker.',
          },
          {
            version: '1.13.4',
            date: '2026-07-07',
            note: 'Every page’s images and fonts preload behind the loading screen, so playback never pops in.',
          },
          {
            version: '1.13.5',
            date: '2026-07-07',
            note: 'Revealed steps no longer bleed through the loading screen.',
          },
          {
            version: '1.13.6',
            date: '2026-07-11',
            note: 'Read-only builds play the deck’s transition and reveal steps one at a time.',
          },
        ],
        contributors: ['adawang1210', 'jeremyjordan'],
      },
      {
        line: '1.12',
        version: '1.12.0',
        date: '2026-06-13',
        kind: 'feature',
        title: 'Every page at a glance',
        summary:
          'Press `O` in the editor to lay every page out in a grid, styled to match the editor around it.',
        highlights: [
          'One-click updates from the home sidebar upgrade open-slide and sync the bundled skills.',
          'PDF export no longer hangs on subsetted CJK webfonts.',
          'The slide-authoring skill learned to load webfonts once, with only the weights a deck uses.',
        ],
        shot: shot('slide-overview', 1334, 'The slide overview grid showing every page of a deck'),
        patches: [
          {
            version: '1.12.1',
            date: '2026-06-21',
            note: 'Transition and step markers in the overview, a tidier toolbar on narrow screens, and HTML exports that keep their aspect ratio on small viewports.',
          },
        ],
        contributors: ['ridemountainpig', 'adawang1210', 'poterpan'],
      },
      {
        line: '1.11',
        version: '1.11.0',
        date: '2026-06-11',
        kind: 'feature',
        title: 'Host anywhere, present faster',
        summary:
          '`base` in the config serves a build from a subpath like GitHub Pages. New shortcuts on the slide view: Space advances, Enter plays in the window, and P opens the presenter.',
        highlights: [
          'The presenter mirrors `<Steps>`: Now Showing matches the projection and Up Next previews the next beat.',
          'PDF exports keep raster backgrounds.',
          'Home thumbnails no longer flash at full size before they settle.',
        ],
        patches: [
          {
            version: '1.11.1',
            date: '2026-06-11',
            note: 'Enter and Escape respect IME composition across inputs, and PPTX exports stop triggering PowerPoint’s repair prompt.',
          },
        ],
        contributors: ['ridemountainpig', 'mvanhorn', 'adawang1210'],
      },
      {
        line: '1.10',
        version: '1.10.0',
        date: '2026-06-04',
        kind: 'feature',
        title: 'Steps',
        summary:
          '`<Steps>` and `<Step>` reveal a page one beat at a time, driven by the same next and previous keys as page navigation.',
        docs: { label: 'Step docs', href: '/docs/primitive/step' },
      },
      {
        line: '1.9',
        version: '1.9.0',
        date: '2026-06-02',
        kind: 'polish',
        title: 'Image PPTX, a language switcher, and version hints',
        highlights: [
          'Export as image PPTX renders each page onto its own PowerPoint slide.',
          'A language switcher next to the theme toggle replaces the `locale` config option.',
          'The home sidebar shows the installed version and nudges you when an update is out.',
        ],
      },
      {
        line: '1.8',
        version: '1.8.0',
        date: '2026-05-31',
        kind: 'polish',
        title: 'Folders you can drag',
        highlights: [
          'Reorder sidebar folders by dragging them.',
          'Click a slide title to rename it in place.',
          'Click-to-navigate zones no longer cover videos and links in present mode.',
          'The inspector finds the right source files on Windows.',
        ],
        contributors: ['why39', 'ridemountainpig'],
      },
      {
        line: '1.7',
        version: '1.7.0',
        date: '2026-05-24',
        kind: 'feature',
        title: 'Page transitions',
        summary:
          'The `SlideTransition` API declares how pages enter and leave, and the authoring skill ships with tasteful examples to start from.',
        highlights: [
          '`I` and `D` toggle the inspector and the Design panel.',
          'Selected images get a floating bar with Replace and Crop.',
          '`init` suggests a safe folder name when yours has shell-unfriendly characters.',
        ],
        docs: { label: 'Transition docs', href: '/docs/primitive/transition' },
        contributors: ['ridemountainpig', 'itskylechung'],
      },
      {
        line: '1.6',
        version: '1.6.0',
        date: '2026-05-20',
        kind: 'polish',
        title: 'Templates, page numbers, and unused files',
        highlights: [
          'Duplicate a deck from its card to use it as a template.',
          '`useSlidePageNumber()` lets a page render its own number.',
          'Unused files in the assets manager get an Unused pill.',
          'PDF exports page through macOS Preview at full speed.',
        ],
        contributors: ['mvanhorn', 'samzzi'],
      },
      {
        line: '1.5',
        version: '1.5.0',
        date: '2026-05-19',
        kind: 'polish',
        title: 'Sorting and sharing',
        highlights: [
          'Sort the home page by creation time or name.',
          'Copy a link to the current slide from the toolbar.',
          'Deleting an asset turns its usages back into image placeholders instead of broken imports.',
          'Dev-server write routes check where requests come from.',
        ],
        contributors: ['ridemountainpig', 'DeryFerd'],
      },
      {
        line: '1.4',
        version: '1.4.0',
        date: '2026-05-15',
        kind: 'feature',
        title: 'Global assets and a Present menu',
        summary:
          'A project-wide `assets/` folder, imported with `@assets/*`, is shared by every deck and theme. The Present button gained a menu for windowed play, fullscreen, and presenter mode.',
        highlights: ['Style a selected range of text inside the inspector’s content field.'],
        contributors: ['chentyke'],
      },
      {
        line: '1.3',
        version: '1.3.0',
        date: '2026-05-13',
        kind: 'feature',
        title: 'Themes',
        summary:
          'Themes under `themes/` get a gallery and a page of their own, each previewed live from a paired demo slide. Decks can name the theme they came from, and `/create-theme` writes both files.',
        highlights: [
          'Drop an image onto an `<ImagePlaceholder />` to upload and assign it in one step.',
          'Resize the thumbnail rail by dragging its edge.',
          'New decks appear on the home page without restarting the dev server.',
          '`init` asks which package manager to use.',
        ],
        shot: shot('themes', 1138, 'A theme page with its live demo slide and description'),
        docs: { label: 'Themes docs', href: '/docs/core-feature/themes' },
      },
      {
        line: '1.2',
        version: '1.2.0',
        date: '2026-05-10',
        kind: 'feature',
        title: 'Your agent sees what you see',
        summary:
          'The dev server publishes the current slide, page, and selected element, and the `current-slide` skill lets agents resolve “this page” and “this element”. An Agent connected badge shows the link is live.',
        highlights: [
          'A notes drawer under the canvas edits speaker notes page by page.',
          'Right-click a thumbnail to duplicate or delete its page.',
          'The crop rectangle in the Crop dialog can be resized.',
        ],
        docs: { label: '/current-slide docs', href: '/docs/skills/current-slide' },
      },
      {
        line: '1.1',
        version: '1.1.0',
        date: '2026-05-07',
        kind: 'polish',
        title: 'Reorder by dragging',
        highlights: [
          'Drag thumbnails to reorder pages. The new order is written back to `index.tsx`.',
          'A shuffle button in the Design panel tries a curated preset for inspiration.',
          'A Crop dialog frames replaced images, and replacements keep the placeholder’s aspect ratio.',
        ],
      },
      {
        line: '1.0',
        version: '1.0.0',
        date: '2026-05-02',
        kind: 'major',
        title: 'open-slide 1.0',
        summary:
          'Two weeks after the first commit: a 1920 × 1080 React canvas, present mode, an inspector for comments and quick edits, a Design panel, static HTML export, and the agent skills that write the decks.',
        shot: shot('home', 1138, 'The open-slide home page listing every deck in the workspace'),
        docs: { label: 'Getting started', href: '/docs/getting-started' },
        patches: [
          {
            version: '1.0.1',
            date: '2026-05-02',
            note: 'Generated slides use design tokens by default, so the Design panel can tweak them right away.',
          },
          {
            version: '1.0.2',
            date: '2026-05-02',
            note: 'The `radius` design token is a single number.',
          },
          {
            version: '1.0.3',
            date: '2026-05-03',
            note: 'The starter template includes the required `radius` field.',
          },
          {
            version: '1.0.4',
            date: '2026-05-03',
            note: '`create-slide` proposes three visual directions tailored to the topic instead of a fixed preset list.',
          },
          {
            version: '1.0.5',
            date: '2026-05-04',
            note: 'The UI in English, Traditional and Simplified Chinese, and Japanese, plus inspector edits that land on the right instance of repeated content.',
          },
          {
            version: '1.0.6',
            date: '2026-05-05',
            note: 'The dev server runs on Windows, and the inspect highlight stays aligned as the panel opens.',
          },
        ],
        contributors: ['Willaiem', 'chentyke'],
      },
    ],
  },
  {
    id: 'preview',
    label: '0.x',
    title: 'Preview',
    blurb: 'Sixteen releases in two weeks, built in the open.',
    span: 'Apr 2026',
    releases: [
      {
        line: '0.0',
        version: '0.0.1',
        date: '2026-04-19',
        kind: 'origin',
        title: 'The first commit',
        summary:
          'open-slide started on April 19 as a canvas, a player, and a `create-slide` skill. By 0.0.16 it had folders, an inspector, HTML downloads, a typed `open-slide.config.ts`, and a landing page.',
      },
    ],
  },
];

export const latestVersion =
  eras[0].releases[0].patches?.at(-1)?.version ?? eras[0].releases[0].version;

// Published @open-slide/core versions, previews and betas included.
export const coreReleaseCount = 68;
export const contributorCount = new Set(
  eras.flatMap((era) => era.releases.flatMap((release) => release.contributors ?? [])),
).size;
