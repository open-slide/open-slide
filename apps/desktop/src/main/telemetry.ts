import { readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { app, crashReporter } from 'electron';
import { type EventMessage, PostHog } from 'posthog-node';
import type { ReportedError } from '../shared/types';
import { settings } from './settings';
import { bundledCore } from './workspace';

type Value = string | number | boolean | null | undefined;
type Properties = Record<string, Value>;

const HOST = 'https://us.i.posthog.com';
const TOKEN = import.meta.env.MAIN_VITE_POSTHOG_TOKEN ?? '';
const SHUTDOWN_TIMEOUT_MS = 2000;
const ERROR_WINDOW_MS = 60_000;
const MAX_ERRORS_PER_WINDOW = 10;
const MAX_HELD = 50;

let client: PostHog | null = null;
let base: Properties = {};

function allowed(): boolean {
  const flag = process.env.OPEN_SLIDE_TELEMETRY;
  if (!TOKEN || flag === '0' || process.env.DO_NOT_TRACK === '1') return false;
  return app.isPackaged || flag === '1';
}

function enabled(): boolean {
  return client !== null && settings.get().telemetry;
}

// The tour is where the user is told about telemetry and how to turn it off,
// so nothing leaves before it ends: events wait here, and are dropped if the
// user opts out or quits first.
const held: ((client: PostHog) => void)[] = [];

function send(deliver: (client: PostHog) => void) {
  if (!client) return;
  if (!settings.onboarded()) {
    if (held.length < MAX_HELD) held.push(deliver);
    return;
  }
  releaseHeld();
  deliver(client);
}

function releaseHeld() {
  if (!client || !settings.onboarded()) return;
  const waiting = held.splice(0);
  if (!enabled()) return;
  for (const deliver of waiting) deliver(client);
}

function osName(): string {
  if (process.platform === 'darwin') return 'macOS';
  if (process.platform === 'win32') return 'Windows';
  if (process.platform === 'linux') return 'Linux';
  return process.platform;
}

// Stack frames and messages carry absolute paths, and the home directory names
// the user. The SDK rewrites frame paths relative to the cwd, which is `/` in a
// packaged app, so the home directory also appears without its root. Paths are
// matched as JSON text, so Windows backslashes are escaped; longest first.
function homeNeedles(): string[] {
  const home = os.homedir();
  if (!home) return [];
  const forms = [home, home.replaceAll('\\', '/')];
  const rootless = forms.map((form) => form.slice(path.parse(form).root.length));
  return [...new Set([...forms, ...rootless])]
    .filter((form) => form.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((form) => JSON.stringify(form).slice(1, -1));
}

const HOME_NEEDLES = homeNeedles();

function redact(event: EventMessage): EventMessage {
  if (!event.properties) return event;
  let json = JSON.stringify(event.properties);
  for (const needle of HOME_NEEDLES) json = json.replaceAll(needle, '~');
  return { ...event, properties: JSON.parse(json) };
}

const LOCAL_URL_RE = /(https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?)[^\s"'`)]*/g;
const QUOTED_PATH_RE = /(['"`])(?:\/|[A-Za-z]:[\\/])[^'"`\n]*\1/g;
const POSIX_PATH_RE = /(?<![\w.:/<])\/(?:[^\s/'":]+\/)+[^\s/'":]*/g;
const WINDOWS_PATH_RE = /\b[A-Za-z]:\\[^\s'":]+/g;

// Error messages quote whatever the failing call was given: a save path named
// after a deck, a dev-server URL ending in a deck id. Neither leaves the
// machine; the error's name, code and stack are enough to act on.
function scrubMessage(text: string): string {
  return text
    .replace(LOCAL_URL_RE, '$1')
    .replace(QUOTED_PATH_RE, '$1<path>$1')
    .replace(POSIX_PATH_RE, '<path>')
    .replace(WINDOWS_PATH_RE, '<path>');
}

function scrubError(error: unknown): Error {
  if (!(error instanceof Error)) return new Error(scrubMessage(String(error)));
  const message = scrubMessage(error.message);
  const clean = new Error(message);
  clean.name = error.name;
  clean.stack = error.stack?.replace(error.message, message) ?? `${error.name}: ${message}`;
  return clean;
}

let errorWindowStart = 0;
const reported = new Set<string>();

// An error thrown from a frame loop or a retry would otherwise arrive once per
// frame: each distinct error is sent once a minute, up to a cap.
function shouldReport(error: Error): boolean {
  const now = Date.now();
  if (now - errorWindowStart > ERROR_WINDOW_MS) {
    errorWindowStart = now;
    reported.clear();
  }
  const key = `${error.name}:${error.message}`;
  if (reported.has(key) || reported.size >= MAX_ERRORS_PER_WINDOW) return false;
  reported.add(key);
  return true;
}

// Kept on disk only: PostHog cannot symbolicate minidumps, so the next launch
// reports how many appeared instead.
export function startCrashReporter() {
  crashReporter.start({ uploadToServer: false, compress: true });
}

export function initTelemetry() {
  if (client || !allowed()) return;
  base = {
    $app_version: bundledCore().version,
    $os: osName(),
    $os_version: process.getSystemVersion(),
    arch: process.arch,
    electron_version: process.versions.electron,
    locale: app.getLocale(),
    packaged: app.isPackaged,
  };
  client = new PostHog(TOKEN, {
    host: HOST,
    flushAt: 20,
    flushInterval: 30_000,
    before_send: redact,
  });

  // A monitor observes without taking over, so Electron still shows its own
  // error dialog for an uncaught exception in the main process.
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    captureError(error, { source: 'main', origin });
  });
  process.on('unhandledRejection', (reason) => {
    console.error(reason);
    captureError(reason, { source: 'main', origin: 'unhandledRejection' });
  });
  app.on('render-process-gone', (_e, _contents, details) => {
    if (details.reason === 'clean-exit') return;
    track('process_gone', {
      type: 'renderer',
      reason: details.reason,
      exit_code: details.exitCode,
    });
  });
  app.on('child-process-gone', (_e, details) => {
    if (details.reason === 'clean-exit') return;
    track('process_gone', {
      type: details.type,
      service: details.serviceName ?? details.name ?? null,
      reason: details.reason,
      exit_code: details.exitCode,
    });
  });

  trackLaunch();
}

function findDumps(dir: string, since: number): number {
  try {
    return readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((name) => {
      if (!name.endsWith('.dmp')) return false;
      try {
        return statSync(path.join(dir, name)).mtimeMs > since;
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

function trackLaunch() {
  const version = bundledCore().version;
  const previous = settings.lastVersion();
  const checkedAt = settings.crashCheckedAt();
  settings.setCrashCheckedAt(Date.now());
  settings.setLastVersion(version);

  // Dumps from before the first check predate telemetry, so they are skipped.
  const crashes = checkedAt ? findDumps(app.getPath('crashDumps'), checkedAt) : 0;
  if (crashes > 0) track('native_crash', { count: crashes, crashed_version: previous ?? version });

  const launchType = previous === null ? 'first' : previous === version ? 'normal' : 'updated';
  track('app_launched', { launch_type: launchType, previous_version: previous }, true);
}

export function track(event: string, properties: Properties = {}, setPerson = false) {
  if (!enabled()) return;
  const message = {
    distinctId: settings.installId(),
    event,
    properties: { ...base, ...properties, ...(setPerson ? { $set: base } : {}) },
    timestamp: new Date(),
  };
  send((posthog) => posthog.capture(message));
}

export function captureError(error: unknown, properties: Properties = {}) {
  if (!enabled()) return;
  const clean = scrubError(error);
  if (!shouldReport(clean)) return;
  const code = (error as { code?: unknown } | null)?.code;
  const props = {
    ...base,
    ...properties,
    ...(typeof code === 'string' ? { error_code: code } : {}),
  };
  send((posthog) => posthog.captureException(clean, settings.installId(), props));
}

function isReportedError(value: unknown): value is ReportedError {
  if (typeof value !== 'object' || value === null) return false;
  const { name, message, stack } = value as Record<string, unknown>;
  return (
    typeof name === 'string' &&
    typeof message === 'string' &&
    (stack === null || typeof stack === 'string')
  );
}

export function reportRendererError(report: unknown, window: string) {
  if (!enabled() || !isReportedError(report)) return;
  const error = new Error(report.message);
  error.name = report.name;
  error.stack = report.stack ?? `${report.name}: ${report.message}`;
  // The SDK resolves a frame's source map by the chunk id that posthog-cli
  // injected into its file, read from this process's registry; the renderer's
  // own registry is merged in so its frames resolve here too.
  if (report.chunkIds && typeof report.chunkIds === 'object') {
    const registry = globalThis as { _posthogChunkIds?: Record<string, string> };
    registry._posthogChunkIds = { ...registry._posthogChunkIds, ...report.chunkIds };
  }
  captureError(error, { source: 'renderer', window });
}

export async function shutdownTelemetry() {
  releaseHeld();
  await client?.shutdown(SHUTDOWN_TIMEOUT_MS).catch(() => {});
}

export function bucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 6) return '4-6';
  return '7+';
}
