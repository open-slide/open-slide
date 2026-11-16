import { MousePointer2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ColorField, Field } from '@/components/panel/panel-fields';
import { isTransparent, opaqueHex } from '@/lib/inspector/color';
import { findSlideSource, jsxOwnerType } from '@/lib/inspector/fiber';
import { readCanvas, readFrame } from '@/lib/inspector/visual-dom';
import type { Page } from '@/lib/sdk';
import { describeTransition, type SlideTransition } from '@/lib/transition';
import { format, plural, useLocale } from '@/lib/use-locale';
import { type SelectedTarget, useInspector } from './inspector-provider';

export type PageInfo = {
  index: number;
  total: number;
  component: Page | undefined;
  transition: SlideTransition | undefined;
  inheritedTransition: boolean;
  themed: boolean;
};

type BackgroundSource = 'page' | 'theme' | 'shared' | 'complex';

type PageState = {
  color: string | null;
  preview: string | null;
  source: BackgroundSource;
  target: SelectedTarget | null;
  steps: number;
};

export function PagePanel({ page }: { page: PageInfo }) {
  const t = useLocale();
  const { slideId, bufferOps } = useInspector();
  const state = usePageState(page.index, page.component, slideId);
  const transition = page.transition ? describeTransition(page.transition) : null;

  const setBackground = (value: string | null) => {
    if (!state?.target) return;
    const { line, column, anchor } = state.target;
    bufferOps(line, column, anchor, [
      { kind: 'set-style', key: 'background', value: null },
      { kind: 'set-style', key: 'backgroundColor', value },
    ]);
  };

  const backgroundCaption =
    state?.source === 'theme'
      ? t.inspector.pageBackgroundTheme
      : state?.source === 'shared'
        ? t.inspector.pageBackgroundShared
        : state?.source === 'complex'
          ? t.inspector.pageBackgroundComplex
          : null;

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-3.5 pt-3.5 pb-1 text-[12px] font-medium">
        {format(t.inspector.pageLabel, { page: page.index + 1, total: page.total })}
      </div>
      <div className="flex flex-col gap-3 px-3.5 py-4">
        <div className="flex flex-col gap-1">
          {state?.target && state.source !== 'complex' ? (
            <ColorField
              label={t.inspector.pageBackground}
              value={state.color ?? '#ffffff'}
              dim={!state.color}
              onChange={setBackground}
              onClear={
                page.themed && state.source === 'page' ? () => setBackground(null) : undefined
              }
            />
          ) : (
            <Field label={t.inspector.pageBackground}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-border bg-background">
                <span
                  className="size-4 rounded-[3px] ring-1 ring-foreground/10 ring-inset"
                  style={{
                    backgroundColor: state?.color ?? 'transparent',
                    backgroundImage: state?.preview ?? undefined,
                  }}
                />
              </span>
              {!state?.preview && (
                <span className="nums font-mono text-[11px] text-foreground/80 uppercase">
                  {state?.color ?? '—'}
                </span>
              )}
            </Field>
          )}
          {backgroundCaption && <Caption>{backgroundCaption}</Caption>}
        </div>
        <div className="flex flex-col gap-1">
          <Field label={t.inspector.pageTransition}>
            <span className="truncate text-[12px]">
              {transition ? (
                <>
                  {t.inspector.transitionKinds[transition.kind]}
                  <span className="nums text-muted-foreground"> · {transition.duration}ms</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t.inspector.pageNone}</span>
              )}
            </span>
          </Field>
          {transition && page.inheritedTransition && (
            <Caption>{t.inspector.pageTransitionInherited}</Caption>
          )}
        </div>
        <Field label={t.inspector.pageSteps}>
          <span className="nums text-[12px]">
            {state && state.steps > 0 ? (
              format(plural(state.steps, t.inspector.pageStepsCount), { count: state.steps })
            ) : (
              <span className="text-muted-foreground">{t.inspector.pageNone}</span>
            )}
          </span>
        </Field>
      </div>
      <p className="mt-auto flex items-start gap-2 border-t border-hairline px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <MousePointer2 aria-hidden className="mt-0.5 size-3 shrink-0" />
        {t.inspector.emptySelectionHint}
      </p>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="pl-20 text-[11px] text-muted-foreground">{children}</p>;
}

function usePageState(index: number, component: Page | undefined, slideId: string) {
  const [state, setState] = useState<PageState | null>(null);
  const read = useCallback(
    () => setState(readPageState(index, component, slideId)),
    [index, component, slideId],
  );

  useEffect(() => {
    read();
    const canvas = readCanvas();
    if (!canvas) return;
    let raf = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    });
    observer.observe(canvas.root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-osd-step', 'data-osd-current-page'],
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [read]);

  return state;
}

function readPageState(
  index: number,
  component: Page | undefined,
  slideId: string,
): PageState | null {
  const canvas = readCanvas();
  const layer = canvas?.root.querySelector<HTMLElement>(`[data-osd-current-page="${index}"]`);
  if (!canvas || !layer) return null;

  const covers = (el: HTMLElement) => {
    const frame = readFrame(el, canvas);
    return (
      Math.abs(frame.x) < 1 &&
      Math.abs(frame.y) < 1 &&
      frame.width >= canvas.width - 1 &&
      frame.height >= canvas.height - 1
    );
  };
  const chain: HTMLElement[] = [];
  let level: HTMLElement | null = layer;
  while (level) {
    const next: HTMLElement | undefined = Array.from(level.children).find(
      (child): child is HTMLElement => child instanceof HTMLElement && covers(child),
    );
    if (next) chain.push(next);
    level = next ?? null;
  }

  // Only JSX written in this page's own component is safe to edit: a shared
  // frame component would carry the change onto every page that uses it.
  const ownTarget = (el: HTMLElement): SelectedTarget | null => {
    if (!component || jsxOwnerType(el) !== component) return null;
    const hit = findSlideSource(el, slideId, { hostOnly: true });
    return hit?.anchor === el ? hit : null;
  };

  const steps = layer.querySelectorAll('[data-osd-step]').length;
  const painted = [...chain].reverse().find((el) => {
    const style = getComputedStyle(el);
    return !isTransparent(style.backgroundColor) || style.backgroundImage !== 'none';
  });

  const themeBackground = layer.parentElement
    ? getComputedStyle(layer.parentElement).backgroundColor
    : '';
  const themeColor = opaqueHex(themeBackground);
  if (!painted) {
    const target = chain.map(ownTarget).find(Boolean) ?? null;
    return { color: themeColor, preview: null, source: 'theme', target, steps };
  }

  const style = getComputedStyle(painted);
  const target = ownTarget(painted);
  const color = opaqueHex(style.backgroundColor);
  const complex = style.backgroundImage !== 'none';
  // A page that writes its own background owns it even when it matches the
  // theme, so it can still be reset to follow later theme changes.
  const ownBackground = Boolean(
    target && (painted.style.background || painted.style.backgroundColor),
  );
  return {
    color,
    preview: complex ? style.backgroundImage : null,
    source: complex
      ? 'complex'
      : ownBackground
        ? 'page'
        : color && color === themeColor
          ? 'theme'
          : target
            ? 'page'
            : 'shared',
    target,
    steps,
  };
}
