import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { type DesktopSettings, PACKAGE_MANAGERS, type PackageManager } from '../shared/types';

export type DeckSession = { decks: { slideId: string; title: string }[]; active: string | null };

type Bounds = { x: number; y: number; width: number; height: number };

type Stored = DesktopSettings & {
  workspace: string | null;
  recent: string[];
  // Workspaces whose code the user agreed to run.
  trusted: string[];
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
  trusted: [],
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

type Check = (value: unknown) => boolean;

const isString: Check = (v) => typeof v === 'string';
const isBoolean: Check = (v) => typeof v === 'boolean';
const isNumber: Check = (v) => typeof v === 'number' && Number.isFinite(v);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const nullOr =
  (check: Check): Check =>
  (v) =>
    v === null || check(v);
const recordOf =
  (check: Check): Check =>
  (v) =>
    isRecord(v) && Object.values(v).every(check);
const isSession: Check = (v) =>
  isRecord(v) &&
  nullOr(isString)(v.active) &&
  Array.isArray(v.decks) &&
  v.decks.every((d) => isRecord(d) && isString(d.slideId) && isString(d.title));
const isBounds: Check = (v) =>
  isRecord(v) && [v.x, v.y, v.width, v.height].every((side) => isNumber(side));

const checks: { [K in keyof Stored]: Check } = {
  translucent: isBoolean,
  packageManager: (v) => v === null || (PACKAGE_MANAGERS as readonly unknown[]).includes(v),
  telemetry: isBoolean,
  workspace: nullOr(isString),
  recent: (v) => Array.isArray(v) && v.every(isString),
  trusted: (v) => Array.isArray(v) && v.every(isString),
  sessions: recordOf(isSession),
  ports: recordOf((v) => Number.isInteger(v) && (v as number) > 0 && (v as number) < 65536),
  skillsVersions: recordOf(isString),
  bounds: nullOr(isBounds),
  loginPath: nullOr(isString),
  introSeen: isBoolean,
  onboarded: isBoolean,
  installId: nullOr(isString),
  lastVersion: nullOr(isString),
  crashCheckedAt: isNumber,
};

function load(): Stored {
  let saved: unknown;
  try {
    saved = JSON.parse(readFileSync(file(), 'utf8'));
  } catch {
    return structuredClone(defaults);
  }
  if (!isRecord(saved)) return structuredClone(defaults);
  // Settings written before the first-run tour existed belong to people who
  // already set the app up, so they skip it.
  const next: Record<string, unknown> = {
    ...structuredClone(defaults),
    introSeen: true,
    onboarded: true,
  };
  // A hand-edited or damaged field falls back to its default on its own.
  for (const key of Object.keys(checks) as (keyof Stored)[]) {
    if (key in saved && checks[key](saved[key])) next[key] = saved[key];
  }
  const loaded = next as Stored;
  // Settings from before trust was asked for list workspaces that already ran.
  if (!('trusted' in saved)) loaded.trusted = [...loaded.recent];
  return loaded;
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
  // Returns the workspaces this pushed off the end of the recent list, whose
  // per-workspace records go with them.
  setWorkspace(root: string | null): string[] {
    const s = current();
    s.workspace = root;
    const all = root ? [root, ...s.recent.filter((r) => r !== root)] : s.recent;
    s.recent = all.slice(0, RECENT_LIMIT);
    const evicted = all.slice(RECENT_LIMIT);
    for (const gone of evicted) settings.forget(gone);
    save();
    return evicted;
  },
  forget(root: string) {
    const s = current();
    s.recent = s.recent.filter((r) => r !== root);
    s.trusted = s.trusted.filter((r) => r !== root);
    delete s.sessions[root];
    delete s.ports[root];
    delete s.skillsVersions[root];
    save();
  },
  trusted(root: string): boolean {
    return current().trusted.includes(root);
  },
  trust(root: string) {
    const s = current();
    if (s.trusted.includes(root)) return;
    s.trusted.push(root);
    save();
  },
  session(root: string): DeckSession {
    return current().sessions[root] ?? { decks: [], active: null };
  },
  setSession(root: string, session: DeckSession) {
    const sessions = current().sessions;
    if (JSON.stringify(sessions[root]) === JSON.stringify(session)) return;
    sessions[root] = session;
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
