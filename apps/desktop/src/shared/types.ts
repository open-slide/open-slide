export const TAB_STRIP_HEIGHT = 40;

// Matches no core route, so a spare view boots the whole app behind a cheap
// not-found page and waits there until a tab adopts it.
export const SPARE_PATH = '/__open-slide-spare__';

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export type ServerStatus =
  | { state: 'idle' }
  | { state: 'not-installed'; packageManager: PackageManager }
  | { state: 'installing' }
  | { state: 'starting' }
  | { state: 'ready'; url: string }
  | { state: 'error'; message: string };

export type TabInfo = {
  id: string;
  kind: 'home' | 'deck';
  slideId: string | null;
  title: string;
  loading: boolean;
};

export type WorkspaceInfo = { root: string; name: string };

export type AppState = {
  platform: string;
  translucent: boolean;
  // The system accent as #rrggbbaa, or null where the platform has none.
  accent: string | null;
  fullscreen: boolean;
  workspace: WorkspaceInfo | null;
  recent: string[];
  server: ServerStatus;
  tabs: TabInfo[];
  activeTabId: string | null;
};

export type DesktopSettings = {
  translucent: boolean;
  packageManager: PackageManager | null;
};

export type WorkspaceInspection = {
  path: string;
  name: string;
  kind: 'project' | 'empty' | 'other' | 'missing';
};

export type CreateWorkspaceRequest = {
  parent: string;
  name: string;
  packageManager: PackageManager;
};

export type TaskResult = { ok: true } | { ok: false; error: string };

export type AgentId = 'claude' | 'codex';

export type AgentInfo = {
  id: AgentId;
  name: string;
  sdkVersion: string | null;
  cliPath: string | null;
  cliSource: 'path' | 'bundled' | null;
  cliVersion: string | null;
  signedIn: boolean | null;
  account: string | null;
};

export type LoginEvent =
  | { id: AgentId; type: 'output'; chunk: string }
  | { id: AgentId; type: 'url'; url: string }
  | { id: AgentId; type: 'exit'; ok: boolean };

export type LogTask = 'server' | 'install' | 'create';

export type LogEvent = { task: LogTask; chunk: string };

export type ShellCommand = 'open-workspace' | 'new-workspace';

export type ShellApi = {
  getState(): Promise<AppState>;
  onState(listener: (state: AppState) => void): () => void;
  onLog(listener: (event: LogEvent) => void): () => void;
  onCommand(listener: (command: ShellCommand) => void): () => void;
  setOverlay(open: boolean): void;
  openExternal(url: string): void;
  sendCommand(command: ShellCommand): void;
  window: {
    isFocused(): Promise<boolean>;
    onFocus(listener: (focused: boolean) => void): () => void;
    fitContent(height: number): void;
    openSettings(): void;
  };
  settings: {
    get(): Promise<DesktopSettings>;
    update(patch: Partial<DesktopSettings>): Promise<DesktopSettings>;
  };
  tabs: {
    activate(id: string): void;
    close(id: string): void;
    move(id: string, toIndex: number): void;
    showMenu(id: string): void;
  };
  workspace: {
    choose(): Promise<WorkspaceInspection | null>;
    chooseParent(): Promise<string | null>;
    defaultParent(): Promise<string>;
    packageManagers(): Promise<PackageManager[]>;
    open(path: string): Promise<TaskResult>;
    create(request: CreateWorkspaceRequest): Promise<TaskResult>;
    install(): Promise<TaskResult>;
    reveal(path?: string): void;
    forget(path: string): void;
  };
  server: {
    restart(): void;
    log(): Promise<string>;
  };
  agents: {
    list(): Promise<AgentInfo[]>;
    login(id: AgentId): Promise<TaskResult>;
    logout(id: AgentId): Promise<TaskResult>;
    sendLoginInput(id: AgentId, text: string): void;
    cancelLogin(id: AgentId): void;
    onLogin(listener: (event: LoginEvent) => void): () => void;
  };
};
