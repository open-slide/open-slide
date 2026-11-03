export function splitPath(full: string): { parent: string; name: string } {
  const trimmed = full.replace(/[\\/]+$/, '');
  const i = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return i <= 0
    ? { parent: trimmed.slice(0, i + 1) || trimmed, name: trimmed.slice(i + 1) }
    : { parent: trimmed.slice(0, i), name: trimmed.slice(i + 1) };
}

export function joinPath(parent: string, name: string, platform: string): string {
  const sep = platform === 'win32' ? '\\' : '/';
  return parent.endsWith(sep) ? `${parent}${name}` : `${parent}${sep}${name}`;
}

// Mirrors the CLI's sanitizeDirName: it refuses names a shell would trip on.
export function sanitizeName(value: string): string {
  const safe = value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'my-slides';
}

export function tildify(full: string): string {
  return full.replace(/^\/Users\/[^/]+|^\/home\/[^/]+/, '~');
}
