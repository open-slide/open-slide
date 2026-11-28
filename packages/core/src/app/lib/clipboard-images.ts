import { useEffect, useRef } from 'react';
import { renamedCopy } from '@/lib/assets';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
  'image/tiff': '.tif',
  'image/heic': '.heic',
};

const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export const PASTE_SHORTCUT = IS_APPLE ? '⌘V' : 'Ctrl V';

// `files` and `items` overlap: reading both would upload one screenshot twice.
export function imageFilesFromClipboard(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];
  const out: File[] = [];
  const files = data.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file?.type.startsWith('image/')) out.push(file);
    }
  }
  if (out.length > 0) return out;
  const items = data.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item?.kind !== 'file' || !item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (file) out.push(file);
    }
  }
  return out;
}

// Structural on purpose: `instanceof HTMLElement` is false across realms.
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as (HTMLElement & { type?: string }) | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (el.type ?? 'text').toLowerCase();
  return !NON_TEXT_INPUT_TYPES.has(type);
}

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function extensionFor(file: File): string {
  const byMime = EXTENSION_BY_MIME[file.type.toLowerCase()];
  if (byMime) return byMime;
  const dot = file.name.lastIndexOf('.');
  if (dot > 0) return file.name.slice(dot).toLowerCase();
  return '.png';
}

export function pastedImageStem(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `pasted-${date}-${time}`;
}

// Browsers name clipboard screenshots `image.png`; a file copied from a file
// manager keeps its real name.
function isPlaceholderName(name: string): boolean {
  const stem = name
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase();
  if (!stem) return true;
  return /^(image|images|screenshot|screen shot|clipboard|untitled|unknown|blob)([\s._()-]*\d+\)?)?$/.test(
    stem,
  );
}

export function namePastedImages(files: File[], taken: Iterable<string> = []): File[] {
  const used = new Set(taken);
  const stem = pastedImageStem();
  return files.map((file) => {
    // Vite's `assetsInclude` matches extensions case-sensitively, so
    // `./assets/foo.PNG` would fail to import.
    const name = isPlaceholderName(file.name)
      ? `${stem}${extensionFor(file)}`
      : file.name.replace(/\.[^.]+$/, (ext) => ext.toLowerCase());
    let next = new File([file], name, {
      type: file.type || 'image/png',
      lastModified: file.lastModified,
    });
    if (used.has(next.name)) next = renamedCopy(next, used);
    used.add(next.name);
    return next;
  });
}

// The async Clipboard API needs a secure context, which `open-slide dev --host`
// over plain http on a LAN address is not. Keyboard paste works everywhere.
export function canReadSystemClipboard(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.read === 'function'
  );
}

export async function readImagesFromSystemClipboard(): Promise<File[]> {
  if (!canReadSystemClipboard()) return [];
  const items = await navigator.clipboard.read();
  const out: File[] = [];
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'));
    if (!type) continue;
    const blob = await item.getType(type);
    out.push(new File([blob], `image${EXTENSION_BY_MIME[type] ?? '.png'}`, { type }));
  }
  return out;
}

type PasteClaim = { priority: number; handle: (files: File[]) => void };

// `paste` fires at the focused element, usually <body>, so a listener on the
// panel would never see it. One shared document listener hands the paste to the
// highest-priority mounted surface, so a modal outranks the panel behind it.
const claims: PasteClaim[] = [];
let listening = false;

function onDocumentPaste(event: ClipboardEvent): void {
  if (event.defaultPrevented) return;
  if (isEditableTarget(event.target)) return;
  let winner: PasteClaim | null = null;
  for (const claim of claims) {
    if (!winner || claim.priority >= winner.priority) winner = claim;
  }
  if (!winner) return;
  const files = imageFilesFromClipboard(event.clipboardData);
  if (files.length === 0) return;
  event.preventDefault();
  winner.handle(files);
}

export function usePasteImages(
  enabled: boolean,
  onImages: (files: File[]) => void,
  priority = 0,
): void {
  const latest = useRef(onImages);
  useEffect(() => {
    latest.current = onImages;
  }, [onImages]);

  useEffect(() => {
    if (!enabled) return;
    const claim: PasteClaim = { priority, handle: (files) => latest.current(files) };
    claims.push(claim);
    if (!listening) {
      document.addEventListener('paste', onDocumentPaste);
      listening = true;
    }
    return () => {
      const i = claims.indexOf(claim);
      if (i >= 0) claims.splice(i, 1);
      if (claims.length === 0 && listening) {
        document.removeEventListener('paste', onDocumentPaste);
        listening = false;
      }
    };
  }, [enabled, priority]);
}
