import path from 'node:path';
import {
  app,
  type BrowserWindow,
  type ContextMenuParams,
  Menu,
  type MenuItemConstructorOptions,
  shell,
  type WebContents,
} from 'electron';

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
  toggleShellDevTools: () => void;
  openRecent: (root: string) => void;
  clearRecent: () => void;
  replayIntro: () => void;
};

export function installMenu(actions: MenuActions, recent: string[]) {
  const isMac = process.platform === 'darwin';
  const tabItems: MenuItemConstructorOptions[] = Array.from({ length: 9 }, (_, i) => ({
    label: i === 8 ? 'Last Tab' : `Tab ${i + 1}`,
    accelerator: `CmdOrCtrl+${i + 1}`,
    visible: false,
    click: () => actions.selectTab(i === 8 ? -1 : i),
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
              { label: 'Toggle Shell Developer Tools', click: actions.toggleShellDevTools },
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
        // Ctrl+Tab belongs to the tab switcher, which reads the keys itself; off
        // macOS the menu only displays it.
        {
          label: 'Show Next Tab',
          accelerator: isMac ? 'Cmd+Shift+]' : 'Ctrl+Tab',
          registerAccelerator: isMac,
          click: () => actions.cycleTab(1),
        },
        {
          label: 'Show Previous Tab',
          accelerator: isMac ? 'Cmd+Shift+[' : 'Ctrl+Shift+Tab',
          registerAccelerator: isMac,
          click: () => actions.cycleTab(-1),
        },
        ...tabItems,
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

export function showContextMenu(
  window: BrowserWindow,
  contents: WebContents,
  params: ContextMenuParams,
  extra: MenuItemConstructorOptions[] = [],
) {
  const items: MenuItemConstructorOptions[] = params.isEditable
    ? [
        { role: 'cut', enabled: params.editFlags.canCut },
        { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll' },
      ]
    : params.selectionText
      ? [{ role: 'copy' }]
      : [];
  items.push(...extra);
  if (!app.isPackaged) {
    if (items.length) items.push({ type: 'separator' });
    items.push({
      label: 'Inspect Element',
      click: () => contents.inspectElement(params.x, params.y),
    });
  }
  if (items.length) Menu.buildFromTemplate(items).popup({ window });
}
