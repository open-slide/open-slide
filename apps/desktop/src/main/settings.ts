import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { DesktopSettings, PackageManager } from '../shared/types';

export type DeckSession = { decks: { slideId: string; title: string }[]; active: string | null };

type Bounds = { x: number; y: number; width: number; height: number };

type Stored = DesktopSettings & {
  workspace: string | null;
  recent: string[];
  sessions: Record<string, DeckSession>;
  ports: Record<string, number>;
  skillsVersions: Record<string, string>;
  bounds: Bounds | null;
  loginPath: string | null;
  introSeen: boolean;
  onboarded: boolean;
  installId: string | null;
  lastVersion: string | null;
  crashCheckedAt: number;
};

const RECENT_LIMIT = 8;

const defaults: Stored = {
  translucent: true,
  packageManager: null,
  telemetry: true,
  workspace: null,
  recent: [],
  sessions: {},
  ports: {},
  skillsVersions: {},
  bounds: null,
  loginPath: null,
  introSeen: false,
  onboarded: false,
  installId: null,
  lastVersion: null,
  crashCheckedAt: 0,
};

function file(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load(): Stored {
  try {
    const saved = JSON.parse(readFileSync(file(), 'utf8')) as Partial<Stored>;
    // Settings written before the first-run tour existed belong to people who
    // already set the app up, so they skip it.
    return { ...defaults, introSeen: true, onboarded: true, ...saved };
  } catch {
    return { ...defaults };
  }
}

let stored: Stored | null = null;
let writeTimer: NodeJS.Timeout | null = null;

function current(): Stored {
  stored ??= load();
  return stored;
}

function flush() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = null;
  const target = file();
  mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, JSON.stringify(current(), null, 2));
  renameSync(tmp, target);
}

function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flush, 200);
}

export const settings = {
  flush,
  get(): DesktopSettings {
    const { translucent, packageManager, telemetry } = current();
    return { translucent, packageManager, telemetry };
  },
  update(patch: Partial<DesktopSettings>): DesktopSettings {
    Object.assign(current(), patch);
    save();
    return settings.get();
  },
  workspace(): string | null {
    return current().workspace;
  },
  recent(): string[] {
    return current().recent;
  },
  setWorkspace(root: string | null) {
    const s = current();
    s.workspace = root;
    if (root) s.recent = [root, ...s.recent.filter((r) => r !== root)].slice(0, RECENT_LIMIT);
    save();
  },
  forget(root: string) {
    const s = current();
    s.recent = s.recent.filter((r) => r !== root);
    delete s.sessions[root];
    delete s.ports[root];
    delete s.skillsVersions[root];
    save();
  },
  session(root: string): DeckSession {
    return current().sessions[root] ?? { decks: [], active: null };
  },
  setSession(root: string, session: DeckSession) {
    current().sessions[root] = session;
    save();
  },
  port(root: string): number | null {
    return current().ports[root] ?? null;
  },
  setPort(root: string, port: number) {
    if (current().ports[root] === port) return;
    current().ports[root] = port;
    save();
  },
  skillsVersion(root: string): string | null {
    return current().skillsVersions[root] ?? null;
  },
  setSkillsVersion(root: string, version: string) {
    current().skillsVersions[root] = version;
    save();
  },
  packageManager(): PackageManager | null {
    return current().packageManager;
  },
  bounds(): Bounds | null {
    return current().bounds;
  },
  setBounds(bounds: Bounds) {
    current().bounds = bounds;
    save();
  },
  loginPath(): string | null {
    return current().loginPath;
  },
  setLoginPath(loginPath: string) {
    if (current().loginPath === loginPath) return;
    current().loginPath = loginPath;
    save();
  },
  introSeen(): boolean {
    return current().introSeen;
  },
  setIntroSeen() {
    if (current().introSeen) return;
    current().introSeen = true;
    save();
  },
  onboarded(): boolean {
    return current().onboarded;
  },
  setOnboarded(onboarded: boolean) {
    if (current().onboarded === onboarded) return;
    current().onboarded = onboarded;
    save();
  },
  installId(): string {
    const s = current();
    if (!s.installId) {
      s.installId = randomUUID();
      save();
    }
    return s.installId;
  },
  lastVersion(): string | null {
    return current().lastVersion;
  },
  setLastVersion(version: string) {
    if (current().lastVersion === version) return;
    current().lastVersion = version;
    save();
  },
  crashCheckedAt(): number {
    return current().crashCheckedAt;
  },
  setCrashCheckedAt(time: number) {
    current().crashCheckedAt = time;
    save();
  },
};
