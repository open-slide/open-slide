import { Palette } from 'lucide-react';
import { useMemo } from 'react';
import { format, plural, useLocale } from '@/lib/use-locale';
import { pad2 } from '@/lib/utils';
import { SlidePageProvider } from '../../lib/page-context';
import { slidesByTheme } from '../../lib/slides';
import {
  type Theme,
  type ThemeDemoModule,
  themeSwatches,
  themes,
  useThemeDemo,
} from '../../lib/themes';
import { SlideCanvas } from '../slide-canvas';
import { SafePage } from '../slide-error';
import { ModeBadge, NoDemoState, SwatchStrip } from './theme-parts';

export function ThemesGallery({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useLocale();

  if (themes.length === 0) {
    return <ThemesEmptyState />;
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-x-6 gap-y-10 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
      {themes.map((theme, i) => (
        <li
          key={theme.id}
          className="rise-in"
          style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
        >
          <ThemeCard
            theme={theme}
            onOpen={() => onOpen(theme.id)}
            ariaLabel={format(t.themes.openThemeAria, { name: theme.name })}
          />
        </li>
      ))}
    </ul>
  );
}

function ThemeCard({
  theme,
  onOpen,
  ariaLabel,
}: {
  theme: Theme;
  onOpen: () => void;
  ariaLabel: string;
}) {
  const t = useLocale();
  const demo = useThemeDemo(theme);
  const swatches = useMemo(() => themeSwatches(theme.body, 6), [theme.body]);
  const usedBy = useMemo(() => slidesByTheme(theme.id).length, [theme.id]);
  const pageCount = demo?.default.length ?? 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className="group block w-full rounded-[8px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-video overflow-hidden rounded-[8px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04] group-hover:shadow-floating group-hover:ring-foreground/20 group-active:scale-[0.99] motion-safe:transition-[box-shadow,--tw-ring-color,scale] motion-safe:duration-200">
        <ThemePreview theme={theme} demo={demo} />
        {pageCount > 1 ? (
          <span className="nums pointer-events-none absolute right-2 bottom-2 rounded-[4px] bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.04em] text-white/90 opacity-0 backdrop-blur-sm group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-150">
            {format(plural(pageCount, t.themes.pageCount), { count: pad2(pageCount) })}
          </span>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate font-heading text-[14px] font-medium tracking-tight">
          {theme.name}
        </h3>
        <SwatchStrip swatches={swatches} className="shrink-0" />
      </div>
      {theme.description ? (
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
          {theme.description}
        </p>
      ) : null}
      {theme.mode || usedBy > 0 ? (
        <div className="mt-2.5 flex min-w-0 items-center gap-2">
          {theme.mode ? <ModeBadge mode={theme.mode} /> : null}
          {usedBy > 0 ? (
            <span className="folio truncate">
              {format(plural(usedBy, t.themes.usedByCount), { count: usedBy })}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

function ThemePreview({ theme, demo }: { theme: Theme; demo: ThemeDemoModule | null }) {
  const t = useLocale();

  if (!theme.hasDemo) return <NoDemoState compact />;
  if (!demo) {
    return (
      <div className="grid h-full w-full place-items-center text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60">
        {t.common.loading}
      </div>
    );
  }
  const FirstPage = demo.default[0];
  if (!FirstPage) return <NoDemoState compact />;

  return (
    <div className="h-full w-full">
      <SlideCanvas flat freezeMotion design={demo.design}>
        <SlidePageProvider index={0} total={demo.default.length}>
          <SafePage page={FirstPage} />
        </SlidePageProvider>
      </SlideCanvas>
    </div>
  );
}

function ThemesEmptyState() {
  const t = useLocale();
  return (
    <div className="rounded-[10px] border border-dashed border-border px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="grid size-10 place-items-center rounded-full bg-muted">
          <Palette className="size-[18px] text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-4 font-heading text-[14px] font-semibold tracking-tight">
          {t.themes.noThemesTitle}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {t.themes.noThemesHintPrefix}
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
            /create-theme
          </code>
          {t.themes.noThemesHintSuffix}
        </p>
      </div>
    </div>
  );
}
