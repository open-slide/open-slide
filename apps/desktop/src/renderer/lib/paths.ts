export function baseName(full: string): string {
  const parts = full.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1];
}

export function joinPath(parent: string, name: string, platform: string): string {
  const sep = platform === 'win32' ? '\\' : '/';
  return parent.endsWith(sep) ? `${parent}${name}` : `${parent}${sep}${name}`;
}

// Mirrors the CLI's sanitizeDirName.
export function sanitizeName(value: string): string {
  const safe = value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe && !/^\.+$/.test(safe) ? safe : 'my-slides';
}

export function tildify(full: string): string {
  return full.replace(/^\/Users\/[^/]+|^\/home\/[^/]+/, '~');
}
