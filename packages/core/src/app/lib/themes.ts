import { loadThemeDemo as load, themes as raw } from 'virtual:open-slide/themes';
import { useEffect, useState } from 'react';
import type { DesignSystem } from './design';
import type { Page } from './sdk';

export type Theme = {
  id: string;
  name: string;
  description: string;
  mode: 'dark' | 'light' | null;
  file: string;
  body: string;
  hasDemo: boolean;
};

export type ThemeDemoModule = {
  default: Page[];
  design?: DesignSystem;
};

export type ThemeSwatch = { hex: string; role: string | null };

export const themes: Theme[] = raw;

export async function loadThemeDemo(id: string): Promise<ThemeDemoModule> {
  return load(id);
}

export function useThemeDemo(theme: Theme | undefined): ThemeDemoModule | null {
  const [demo, setDemo] = useState<ThemeDemoModule | null>(null);
  const id = theme?.id;
  const hasDemo = theme?.hasDemo ?? false;
  useEffect(() => {
    setDemo(null);
    if (!id || !hasDemo) return;
    let cancelled = false;
    loadThemeDemo(id)
      .then((mod) => {
        if (!cancelled) setDemo(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, hasDemo]);
  return demo;
}

export const HEX_SOURCE = '#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\\b';

function paletteSection(body: string): string | null {
  const start = body.search(/^##\s+palette\b/im);
  if (start < 0) return null;
  const rest = body.slice(start).replace(/^.*\n?/, '');
  const end = rest.search(/^##\s/m);
  return end < 0 ? rest : rest.slice(0, end);
}

// Prefers the Palette table's `| role | #hex |` rows so swatches carry their
// role names; falls back to every hex in the prompt for free-form themes.
export function themeSwatches(body: string, limit = 8): ThemeSwatch[] {
  const source = paletteSection(body) ?? body;
  const out: ThemeSwatch[] = [];
  const seen = new Set<string>();
  const push = (hex: string, role: string | null) => {
    const key = hex.toLowerCase();
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push({ hex, role });
  };
  for (const line of source.split('\n')) {
    const hexes = line.match(new RegExp(HEX_SOURCE, 'g'));
    if (!hexes) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      const first = trimmed.split('|')[1]?.replace(/[`*]/g, '').trim() ?? '';
      if (first && !new RegExp(HEX_SOURCE).test(first)) {
        push(hexes[0], first);
        continue;
      }
    }
    for (const hex of hexes) push(hex, null);
  }
  return out;
}
