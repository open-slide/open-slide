import path from 'node:path';
import { app, Menu, type MenuItemConstructorOptions, shell } from 'electron';
import type { EditorCommand } from '../shared/types';

export type MenuActions = {
  openSettings: () => void;
  openWorkspace: () => void;
  newWorkspace: () => void;
  revealWorkspace: () => void;
  closeTab: () => void;
  goHome: () => void;
  selectTab: (index: number) => void;
  cycleTab: (delta: number) => void;
  reloadTab: () => void;
  toggleTabDevTools: () => void;
  openRecent: (root: string) => void;
  clearRecent: () => void;
  replayIntro: () => void;
  editor: (command: EditorCommand) => void;
};

const SHAPES: Array<[string, string]> = [
  ['rect', 'Rectangle'],
  ['ellipse', 'Ellipse'],
  ['triangle', 'Triangle'],
  ['right-triangle', 'Right Triangle'],
  ['diamond', 'Diamond'],
  ['pentagon', 'Pentagon'],
  ['hexagon', 'Hexagon'],
  ['star', 'Star'],
  ['arrow', 'Arrow'],
  ['chevron', 'Chevron'],
  ['callout', 'Callout'],
  ['line', 'Line'],
  ['line-arrow', 'Arrow Line'],
];

const LAYOUTS: Array<[string, string]> = [
  ['blank', 'Blank'],
  ['title', 'Title'],
  ['title-body', 'Title & Body'],
  ['section', 'Section'],
  ['two-column', 'Two Columns'],
  ['image', 'Image & Caption'],
  ['quote', 'Quote'],
];

// The deck page owns these shortcuts, so the menu only shows them: a
// registered accelerator would run the action a second time, or steal the
// key from a text field.
function shown(accelerator: string) {
  return { accelerator, registerAccelerator: false };
}

function editorMenus(run: (command: EditorCommand) => void): MenuItemConstructorOptions[] {
  return [
    {
      label: 'Insert',
      submenu: [
        {
          label: 'New Slide',
          submenu: LAYOUTS.map(([layout, label]) => ({
            label,
            click: () => run({ type: 'new-slide', layout }),
          })),
        },
        { type: 'separator' },
        { label: 'Text Box', click: () => run({ type: 'insert-text' }) },
        {
          label: 'Shape',
          submenu: SHAPES.map(([kind, label]) => ({
            label,
            click: () => run({ type: 'insert-shape', kind }),
          })),
        },
        { label: 'Image…', click: () => run({ type: 'insert-image' }) },
      ],
    },
    {
      label: 'Arrange',
      submenu: [
        { label: 'Bring to Front', click: () => run({ type: 'arrange', direction: 'front' }) },
        { label: 'Bring Forward', click: () => run({ type: 'arrange', direction: 'forward' }) },
        { label: 'Send Backward', click: () => run({ type: 'arrange', direction: 'backward' }) },
        { label: 'Send to Back', click: () => run({ type: 'arrange', direction: 'back' }) },
        { type: 'separator' },
        { label: 'Group', ...shown('CmdOrCtrl+Alt+G'), click: () => run({ type: 'group' }) },
        {
          label: 'Ungroup',
          ...shown('CmdOrCtrl+Alt+Shift+G'),
          click: () => run({ type: 'ungroup' }),
        },
        { label: 'Lock / Unlock', ...shown('CmdOrCtrl+L'), click: () => run({ type: 'lock' }) },
        { type: 'separator' },
        { label: 'Duplicate', ...shown('CmdOrCtrl+D'), click: () => run({ type: 'duplicate' }) },
      ],
    },
  ];
}

export function installMenu(actions: MenuActions, recent: string[]) {
  const isMac = process.platform === 'darwin';
  const tabItems: MenuItemConstructorOptions[] = Array.from({ length: 8 }, (_, i) => ({
    label: `Tab ${i + 1}`,
    accelerator: `CmdOrCtrl+${i + 1}`,
    visible: false,
    click: () => actions.selectTab(i),
  }));

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            role: 'appMenu' as const,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { label: 'Settings…', accelerator: 'Cmd+,', click: actions.openSettings },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open Workspace…', accelerator: 'CmdOrCtrl+O', click: actions.openWorkspace },
        { label: 'New Workspace…', accelerator: 'CmdOrCtrl+Shift+N', click: actions.newWorkspace },
        {
          label: 'Open Recent',
          submenu: [
            ...recent.map((root) => ({
              label: path.basename(root) || root,
              toolTip: root,
              click: () => actions.openRecent(root),
            })),
            { type: 'separator' as const },
            { label: 'Clear Menu', enabled: recent.length > 0, click: actions.clearRecent },
          ],
        },
        {
          label: isMac ? 'Reveal Workspace in Finder' : 'Show Workspace Folder',
          click: actions.revealWorkspace,
        },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: actions.closeTab },
        { role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W' },
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              { label: 'Settings', accelerator: 'Ctrl+,', click: actions.openSettings },
              { role: 'quit' as const },
            ]),
      ],
    },
    { role: 'editMenu' },
    ...editorMenus(actions.editor),
    {
      label: 'View',
      submenu: [
        { label: 'Reload Tab', accelerator: 'CmdOrCtrl+R', click: actions.reloadTab },
        ...(app.isPackaged
          ? []
          : [
              {
                label: 'Toggle Tab Developer Tools',
                accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                click: actions.toggleTabDevTools,
              },
              { role: 'toggleDevTools' as const, label: 'Toggle Shell Developer Tools' },
            ]),
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { label: 'Home', accelerator: 'CmdOrCtrl+Shift+H', click: actions.goHome },
        {
          label: 'Show Next Tab',
          accelerator: isMac ? 'Cmd+Shift+]' : 'Ctrl+Tab',
          click: () => actions.cycleTab(1),
        },
        {
          label: 'Show Previous Tab',
          accelerator: isMac ? 'Cmd+Shift+[' : 'Ctrl+Shift+Tab',
          click: () => actions.cycleTab(-1),
        },
        ...tabItems,
        {
          label: 'Last Tab',
          accelerator: 'CmdOrCtrl+9',
          visible: false,
          click: () => actions.selectTab(-1),
        },
        ...(isMac ? [{ type: 'separator' as const }, { role: 'front' as const }] : []),
      ],
    },
    {
      role: 'help',
      submenu: [
        ...(isMac ? [] : [{ role: 'about' as const }, { type: 'separator' as const }]),
        { label: 'Welcome to open-slide', click: actions.replayIntro },
        { type: 'separator' },
        {
          label: 'open-slide Docs',
          click: () => shell.openExternal('https://open-slide.dev/docs'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/open-slide/open-slide/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
