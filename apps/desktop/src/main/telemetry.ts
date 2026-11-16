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
const BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 30_000;
const MAX_WAITING = 200;

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

// Events wait here rather than in the SDK, which cannot drop what it queued, as an opt-out
// must. Nothing leaves before the tour that announces telemetry ends.
const waiting: ((client: PostHog) => void)[] = [];
let batchTimer: NodeJS.Timeout | null = null;

function send(deliver: (client: PostHog) => void) {
  if (waiting.length >= MAX_WAITING) waiting.shift();
  waiting.push(deliver);
  if (waiting.length >= BATCH_SIZE) deliverWaiting();
  else batchTimer ??= setTimeout(deliverWaiting, BATCH_INTERVAL_MS);
}

function clearBatchTimer() {
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = null;
}

function dropWaiting() {
  waiting.length = 0;
  clearBatchTimer();
}

function deliverWaiting() {
  if (!client || !enabled()) {
    dropWaiting();
    return;
  }
  clearBatchTimer();
  if (!settings.onboarded()) {
    if (waiting.length > 0) batchTimer = setTimeout(deliverWaiting, BATCH_INTERVAL_MS);
    return;
  }
  for (const deliver of waiting.splice(0)) deliver(client);
}

export function setTelemetryEnabled(on: boolean) {
  if (!client) return;
  if (on) {
    void client.optIn();
    return;
  }
  dropWaiting();
  void client.optOut();
}

const OS_NAMES: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'macOS',
  win32: 'Windows',
  linux: 'Linux',
};

// The home directory names the user. The SDK makes frame paths relative to the cwd, `/` when
// packaged, so it also appears without its root. Matched as JSON text, longest first.
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
const QUOTED_PATH_RE = /(['"`])(?:\/|[A-Za-z]:[\\/]|\\\\)[^'"`\n]*\1/g;
// An unquoted path may contain spaces, so it runs to the next quote, colon or line end.
const POSIX_PATH_RE = /(?<![\w.:/<])\/(?:[^\s/'":]+\/)+[^'":\n]*/g;
const WINDOWS_PATH_RE = /(?:\b[A-Za-z]:[\\/]|(?<![\w\\])\\\\)[^'":\n]+/g;

// Messages quote paths named after decks and dev-server URLs ending in deck ids.
function scrubMessage(text: string): string {
  return text
    .replace(LOCAL_URL_RE, '$1')
    .replace(QUOTED_PATH_RE, '$1<path>$1')
    .replace(POSIX_PATH_RE, '<path>')
    .replace(WINDOWS_PATH_RE, '<path>');
}

export function scrubError(error: unknown): Error {
  if (!(error instanceof Error)) return new Error(scrubMessage(String(error)));
  const message = scrubMessage(error.message);
  const clean = new Error(message);
  clean.name = error.name;
  // A replacer function, so `$&` in the message is not expanded.
  clean.stack = error.stack?.replace(error.message, () => message) ?? `${error.name}: ${message}`;
  return clean;
}

let errorWindowStart = 0;
const reported = new Set<string>();

// Each distinct error is sent once a minute, up to a cap, so one thrown per frame is not a flood.
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

// Kept on disk: PostHog cannot symbolicate minidumps, so the next launch reports a count.
export function startCrashReporter() {
  crashReporter.start({ uploadToServer: false, compress: true });
}

export function initTelemetry() {
  if (client || !allowed()) return;
  base = {
    $app_version: bundledCore().version,
    $os: OS_NAMES[process.platform] ?? process.platform,
    $os_version: process.getSystemVersion(),
    arch: process.arch,
    electron_version: process.versions.electron,
    locale: app.getLocale(),
    packaged: app.isPackaged,
  };
  client = new PostHog(TOKEN, {
    host: HOST,
    flushAt: 1,
    flushInterval: 0,
    before_send: redact,
    // The SDK retries failed batches without rechecking consent.
    fetch: (url, options) =>
      enabled() ? fetch(url, options) : Promise.reject(new Error('Telemetry is turned off.')),
  });
  if (!settings.get().telemetry) void client.optOut();

  // A monitor keeps Electron's own dialog for uncaught main-process exceptions.
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    captureError(error, { source: 'main', origin });
  });
  process.on('unhandledRejection', (reason) => {
    console.error(reason);
    captureError(reason, { source: 'main', origin: 'unhandledRejection' });
  });
  app.on('render-process-gone', (_e, _contents, details) => {
    trackGone(details, { type: 'renderer' });
  });
  app.on('child-process-gone', (_e, details) => {
    trackGone(details, {
      type: details.type,
      service: details.serviceName ?? details.name ?? null,
    });
  });

  trackLaunch();
}

function trackGone(details: { reason: string; exitCode: number }, properties: Properties) {
  if (details.reason === 'clean-exit') return;
  track('process_gone', { ...properties, reason: details.reason, exit_code: details.exitCode });
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
  // The SDK maps frames to source maps through this process's chunk id registry.
  if (report.chunkIds && typeof report.chunkIds === 'object') {
    const registry = globalThis as { _posthogChunkIds?: Record<string, string> };
    registry._posthogChunkIds = { ...registry._posthogChunkIds, ...report.chunkIds };
  }
  captureError(error, { source: 'renderer', window });
}

export async function shutdownTelemetry() {
  if (settings.onboarded()) deliverWaiting();
  dropWaiting();
  await client?.shutdown(SHUTDOWN_TIMEOUT_MS).catch(() => {});
}

export function bucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 6) return '4-6';
  return '7+';
}
