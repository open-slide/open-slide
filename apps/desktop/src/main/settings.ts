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
const SAVE_DELAY_MS = 200;

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
const listOf =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check);
const recordOf =
  (check: Check): Check =>
  (v) =>
    isRecord(v) && Object.values(v).every(check);
const isSession: Check = (v) =>
  isRecord(v) &&
  nullOr(isString)(v.active) &&
  listOf((d) => isRecord(d) && isString(d.slideId) && isString(d.title))(v.decks);
const isBounds: Check = (v) => isRecord(v) && [v.x, v.y, v.width, v.height].every(isNumber);
const isPort: Check = (v) => Number.isInteger(v) && (v as number) > 0 && (v as number) < 65536;

const checks: { [K in keyof Stored]: Check } = {
  translucent: isBoolean,
  packageManager: nullOr((v) => (PACKAGE_MANAGERS as readonly unknown[]).includes(v)),
  telemetry: isBoolean,
  workspace: nullOr(isString),
  recent: listOf(isString),
  trusted: listOf(isString),
  sessions: recordOf(isSession),
  ports: recordOf(isPort),
  skillsVersions: recordOf(isString),
  bounds: nullOr(isBounds),
  loginPath: nullOr(isString),
  introSeen: isBoolean,
  onboarded: isBoolean,
  installId: nullOr(isString),
  lastVersion: nullOr(isString),
  crashCheckedAt: isNumber,
};

function file(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load(): Stored {
  const loaded: Record<string, unknown> = structuredClone(defaults);
  let saved: unknown;
  try {
    saved = JSON.parse(readFileSync(file(), 'utf8'));
  } catch {}
  if (isRecord(saved)) {
    for (const key of Object.keys(checks) as (keyof Stored)[]) {
      if (checks[key](saved[key])) loaded[key] = saved[key];
    }
  }
  return loaded as Stored;
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
  // Runs from a timer and on quit, where a full disk must not crash the app; the next save retries.
  try {
    const target = file();
    mkdirSync(path.dirname(target), { recursive: true });
    const tmp = `${target}.tmp`;
    writeFileSync(tmp, JSON.stringify(current(), null, 2));
    renameSync(tmp, target);
  } catch (err) {
    console.error('Could not save settings:', err);
  }
}

function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flush, SAVE_DELAY_MS);
}

function put<K extends keyof Stored>(key: K, value: Stored[K]) {
  if (current()[key] === value) return;
  current()[key] = value;
  save();
}

type PerWorkspace = 'ports' | 'skillsVersions';

function putFor<K extends PerWorkspace>(key: K, root: string, value: Stored[K][string]) {
  const records = current()[key] as Record<string, Stored[K][string]>;
  if (records[root] === value) return;
  records[root] = value;
  save();
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
  workspace: (): string | null => current().workspace,
  recent: (): string[] => current().recent,
  // Returns the workspaces pushed off the recent list, whose records are forgotten.
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
  trusted: (root: string): boolean => current().trusted.includes(root),
  trust(root: string) {
    const { trusted } = current();
    if (trusted.includes(root)) return;
    trusted.push(root);
    save();
  },
  session: (root: string): DeckSession => current().sessions[root] ?? { decks: [], active: null },
  setSession(root: string, session: DeckSession) {
    const sessions = current().sessions;
    if (JSON.stringify(sessions[root]) === JSON.stringify(session)) return;
    sessions[root] = session;
    save();
  },
  port: (root: string): number | null => current().ports[root] ?? null,
  setPort: (root: string, port: number) => putFor('ports', root, port),
  skillsVersion: (root: string): string | null => current().skillsVersions[root] ?? null,
  setSkillsVersion: (root: string, version: string) => putFor('skillsVersions', root, version),
  packageManager: (): PackageManager | null => current().packageManager,
  bounds: (): Bounds | null => current().bounds,
  setBounds: (bounds: Bounds) => put('bounds', bounds),
  loginPath: (): string | null => current().loginPath,
  setLoginPath: (loginPath: string) => put('loginPath', loginPath),
  introSeen: (): boolean => current().introSeen,
  setIntroSeen: () => put('introSeen', true),
  onboarded: (): boolean => current().onboarded,
  setOnboarded: (onboarded: boolean) => put('onboarded', onboarded),
  installId(): string {
    const s = current();
    if (!s.installId) put('installId', randomUUID());
    return s.installId as string;
  },
  lastVersion: (): string | null => current().lastVersion,
  setLastVersion: (version: string) => put('lastVersion', version),
  crashCheckedAt: (): number => current().crashCheckedAt,
  setCrashCheckedAt: (time: number) => put('crashCheckedAt', time),
};
