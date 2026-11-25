import type { HapticPattern } from '../../../../packages/core/src/app/lib/desktop-host';

export type {
  DesktopHost,
  HapticPattern,
  UnsavedAction,
  UnsavedGuard,
  UnsavedOutcome,
  UnsavedStatus,
} from '../../../../packages/core/src/app/lib/desktop-host';

export const TAB_STRIP_HEIGHT = 40;

// Matches no core route, so a spare view boots core on a cheap not-found page.
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

export type SwitcherTab = Pick<TabInfo, 'id' | 'kind' | 'title'> & { cover: string | null };

export type SwitcherState = { tabs: SwitcherTab[]; selectedId: string };

export type WorkspaceInfo = { root: string; name: string };

export type WorkspaceError = { id: number; message: string };

export type AppState = {
  platform: string;
  translucent: boolean;
  accent: string | null;
  fullscreen: boolean;
  onboarding: boolean;
  intro: boolean;
  workspace: WorkspaceInfo | null;
  workspaceError: WorkspaceError | null;
  recent: string[];
  server: ServerStatus;
  tabs: TabInfo[];
  activeTabId: string | null;
};

export type DesktopSettings = {
  translucent: boolean;
  packageManager: PackageManager | null;
  telemetry: boolean;
};

export type ReportedError = {
  name: string;
  message: string;
  stack: string | null;
  chunkIds: Record<string, string> | null;
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

export const AGENT_IDS = ['claude', 'codex'] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type AgentInfo = {
  id: AgentId;
  name: string;
  sdkVersion: string | null;
  cliPath: string | null;
  cliSource: 'path' | 'downloaded' | null;
  cliInstallable: boolean;
  cliVersion: string | null;
  signedIn: boolean | null;
  account: string | null;
};

export type LoginState = {
  id: AgentId;
  operation: number;
  phase: 'idle' | 'downloading' | 'signing-in' | 'succeeded' | 'failed';
  output: string;
  url: string | null;
  download: { received: number; total: number | null } | null;
  error: string | null;
};

export type LogTask = 'server' | 'install' | 'create';

export type LogEvent = { task: LogTask; chunk: string };

export type ShellCommand = 'open-workspace' | 'new-workspace';

export type IntroTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  dark: boolean;
};

export type ShellApi = {
  getState(): Promise<AppState>;
  onState(listener: (state: AppState) => void): () => void;
  onLog(listener: (event: LogEvent) => void): () => void;
  onCommand(listener: (command: ShellCommand) => void): () => void;
  setOverlay(open: boolean): void;
  openExternal(url: string): void;
  sendCommand(command: ShellCommand): void;
  haptic(pattern: HapticPattern): void;
  reportError(error: ReportedError): void;
  window: {
    isFocused(): Promise<boolean>;
    onFocus(listener: (focused: boolean) => void): () => void;
    fitContent(height: number): void;
    openSettings(): void;
  };
  onboarding: {
    finish(): void;
  };
  intro: {
    target(): Promise<IntroTarget | null>;
    reveal(): void;
    done(skipped: boolean): void;
    close(): void;
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
  switcher: {
    onState(listener: (state: SwitcherState | null) => void): () => void;
    pick(id: string | null): void;
  };
  workspace: {
    choose(): Promise<{ create: string; inPlace: boolean; defaultName?: string } | null>;
    chooseParent(): Promise<string | null>;
    defaultParent(): Promise<string>;
    packageManagers(): Promise<PackageManager[]>;
    open(path: string): Promise<TaskResult>;
    create(request: CreateWorkspaceRequest): Promise<TaskResult>;
    createDefault(): Promise<TaskResult>;
    install(): Promise<TaskResult>;
    reveal(): void;
    showPicker(anchor?: { x: number; y: number }): void;
    forget(path: string): void;
    dismissError(id: number): void;
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
    dismissLogin(id: AgentId): void;
    logins(): Promise<LoginState[]>;
    onLoginState(listener: (state: LoginState) => void): () => void;
  };
};
