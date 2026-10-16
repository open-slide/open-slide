import config from 'virtual:open-slide/config';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, useLocale } from '@/lib/use-locale';
import {
  dismissUpdate,
  isUpdateLocked,
  notesKey,
  openWhatsNew,
  startUpdate,
  useUpdate,
} from '@/lib/use-update';
import { ReleaseCover } from './release-notes';

export function UpdateCard() {
  const t = useLocale();
  const { latest, dismissed, phase, notes } = useUpdate();
  if (!latest || dismissed || phase === 'done') return null;

  const newest = notes[notesKey(config.version, latest)]?.[0];
  const release = newest?.version === latest ? newest : null;

  return (
    <div className="rise-in mx-2 mb-2 overflow-hidden rounded-[8px] border border-border bg-card shadow-edge">
      {release?.image && (
        <button
          type="button"
          onClick={openWhatsNew}
          aria-label={t.update.whatsNew}
          className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset"
        >
          <ReleaseCover key={release.image} src={release.image} />
        </button>
      )}
      <div className="flex flex-col gap-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.08em] text-brand uppercase">
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60 [animation-iteration-count:3] motion-reduce:hidden" />
              <span className="size-1.5 rounded-full bg-brand" />
            </span>
            {t.update.available}
          </span>
          <button
            type="button"
            onClick={dismissUpdate}
            aria-label={t.update.dismiss}
            title={t.update.dismiss}
            className="-my-1 -mr-1 flex size-5 items-center justify-center rounded-[4px] text-muted-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-brand"
          >
            <X className="size-3" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-2 text-[12.5px] leading-snug font-medium text-foreground">
            {release?.title ?? format(t.update.cardFallbackTitle, { version: latest })}
          </span>
          <span className="folio text-[10px]">
            v{config.version} → v{latest}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="brand"
            disabled={isUpdateLocked()}
            onClick={startUpdate}
          >
            {t.update.updateNow}
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={openWhatsNew}>
            {t.update.whatsNew}
          </Button>
        </div>
      </div>
    </div>
  );
}
