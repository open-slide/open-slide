import config from 'virtual:open-slide/config';
import { useEffect } from 'react';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLocale } from '@/lib/use-locale';
import { initUpdates, openWhatsNew, useUpdate } from '@/lib/use-update';
import { UpdateCard } from '../update/update-card';

export function SidebarFooter() {
  const t = useLocale();
  const { latest } = useUpdate();

  useEffect(() => {
    initUpdates();
  }, []);

  const label = `v${config.version}`;

  return (
    <>
      {import.meta.env.DEV && <UpdateCard />}
      <div className="flex items-center justify-between gap-2 py-1.5 pr-2 pl-4 text-[11px] text-muted-foreground/70 tabular-nums">
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={openWhatsNew}
            title={t.update.whatsNew}
            className="-ml-1 inline-flex items-center gap-1.5 rounded-[4px] px-1 py-0.5 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-brand"
          >
            {latest && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
            {label}
          </button>
        ) : (
          <span className="inline-flex cursor-default items-center">{label}</span>
        )}
        <div className="flex shrink-0 items-center">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
