const DECK_PATH_RE = /^\/s\/([^/]+)\/?$/;

export function stripBase(pathname: string, base = ''): string {
  if (!base || !pathname.startsWith(base)) return pathname;
  const rest = pathname.slice(base.length);
  if (rest === '') return '/';
  return rest.startsWith('/') ? rest : pathname;
}

export function deckIdFromPath(pathname: string, base = ''): string | null {
  const m = DECK_PATH_RE.exec(stripBase(pathname, base));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

export function isHomePath(pathname: string, base = ''): boolean {
  return !stripBase(pathname, base).startsWith('/s/');
}
