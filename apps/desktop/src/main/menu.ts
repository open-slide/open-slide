import path from 'node:path';
import { app, Menu, type MenuItemConstructorOptions, shell } from 'electron';

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
};

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
