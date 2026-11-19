export const DEV_SUPERVISED_ENV = 'OPEN_SLIDE_DEV_SUPERVISED';
export const MANAGED_CORE_ENV = 'OPEN_SLIDE_MANAGED_CORE';
export const CACHE_DIR_ENV = 'OPEN_SLIDE_CACHE_DIR';
export const RESTART_EXIT_CODE = 52;

const LISTENING_TYPE = 'open-slide:listening';

export function listeningMessage(port: number) {
  return { type: LISTENING_TYPE, port };
}

export function listeningPort(message: unknown): number | null {
  if (typeof message !== 'object' || message === null) return null;
  const { type, port } = message as { type?: unknown; port?: unknown };
  return type === LISTENING_TYPE && typeof port === 'number' ? port : null;
}
