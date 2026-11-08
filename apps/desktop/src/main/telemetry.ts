import { readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { app, crashReporter } from 'electron';
import { type EventMessage, PostHog } from 'posthog-node';
import type { ReportedError } from '../shared/types';
import { settings } from './settings';
import { bundledCore } from './workspace';

type Value = string | number | boolean | null | undefined;
export type Properties = Record<string, Value>;

const HOST = 'https://us.i.posthog.com';
const TOKEN = import.meta.env.MAIN_VITE_POSTHOG_TOKEN ?? '';
const SHUTDOWN_TIMEOUT_MS = 2000;

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
  if (!enabled() || !client) return;
  client.capture({
    distinctId: settings.installId(),
    event,
    properties: { ...base, ...properties, ...(setPerson ? { $set: base } : {}) },
  });
}

export function captureError(error: unknown, properties: Properties = {}) {
  if (!enabled() || !client) return;
  client.captureException(error, settings.installId(), { ...base, ...properties });
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
  await client?.shutdown(SHUTDOWN_TIMEOUT_MS).catch(() => {});
}

export function bucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 6) return '4-6';
  return '7+';
}
