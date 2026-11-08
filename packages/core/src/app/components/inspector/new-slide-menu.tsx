import {
  Columns2,
  Heading,
  ImageIcon,
  type LucideIcon,
  Plus,
  Quote,
  Rows2,
  Square,
  TextQuote,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ColorField, Section } from '@/components/panel/panel-fields';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { resolveColor } from '@/lib/inspector/color';
import type { PageLayout, PageLayoutText } from '@/lib/structure';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { useInspector } from './inspector-provider';

const LAYOUT_ICONS: Record<PageLayout, LucideIcon> = {
  blank: Square,
  title: Heading,
  'title-body': Rows2,
  section: TextQuote,
  'two-column': Columns2,
  image: ImageIcon,
  quote: Quote,
};

export function NewSlideMenu({
  current,
  onInserted,
}: {
  current: number;
  onInserted: (index: number) => void;
}) {
  const t = useLocale();
  const insp = useInspector();
  if (import.meta.env.PROD) return null;
  const copy: PageLayoutText = {
    title: t.inspector.pageCopyTitle,
    subtitle: t.inspector.pageCopySubtitle,
    body: t.inspector.pageCopyBody,
    quote: t.inspector.pageCopyQuote,
    attribution: t.inspector.pageCopyAttribution,
    imageHint: t.inspector.insertImage,
  };
  const layouts = Object.keys(LAYOUT_ICONS) as PageLayout[];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={insp.committing}
        aria-label={t.inspector.newSlide}
        title={t.inspector.newSlide}
        className={cn(
          'flex size-5 items-center justify-center rounded-[3px] text-muted-foreground/70 outline-none',
          'motion-safe:transition-colors hover:bg-muted hover:text-foreground',
          'focus-visible:ring-1 focus-visible:ring-brand',
        )}
      >
        <Plus className="size-3.5" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {layouts.map((layout) => {
          const Icon = LAYOUT_ICONS[layout];
          return (
            <DropdownMenuItem
              key={layout}
              onClick={async () => {
                const index = await insp.addPage(current, layout, copy);
                if (index !== null) onInserted(index);
              }}
            >
              <Icon />
              {t.inspector.pageLayouts[layout]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function pageRoot(): HTMLElement | null {
  const layer = document.querySelector('[data-inspector-root] [data-osd-current-page]');
  const root = layer?.firstElementChild;
  return root instanceof HTMLElement ? root : null;
}

// Shown when nothing is selected: the slide itself is the object.
export function SlideBackgroundSection() {
  const t = useLocale();
  const insp = useInspector();
  const [value, setValue] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read after the frame: a page switch or a write remounts the page layer.
  useEffect(() => {
    void insp.pageIndex;
    void insp.opsVersion;
    if (insp.committing) return;
    const frame = requestAnimationFrame(() => {
      const root = pageRoot();
      setValue(root ? resolveColor(root, getComputedStyle(root).backgroundColor) : null);
    });
    return () => cancelAnimationFrame(frame);
  }, [insp.pageIndex, insp.opsVersion, insp.committing]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (import.meta.env.PROD) return null;

  // The color picker streams changes while dragging; preview each one on the
  // canvas and write only the value it settles on.
  const change = (next: string) => {
    setValue(next);
    const root = pageRoot();
    if (root) root.style.background = next;
    if (timer.current) clearTimeout(timer.current);
    const pageIndex = insp.pageIndex;
    timer.current = setTimeout(() => {
      void insp.runStructure({ kind: 'page-style', pageIndex, style: { background: next } });
    }, 400);
  };

  return (
    <Section title={t.inspector.slideSection}>
      <ColorField
        label={t.inspector.backgroundColor}
        value={value ?? '#ffffff'}
        dim={!value}
        onChange={change}
      />
    </Section>
  );
}
