import config from 'virtual:open-slide/config';
import { ArrowUpRight, Check, CornerDownLeft } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { format, useLocale } from '@/lib/use-locale';
import {
  closeWhatsNew,
  isUpdateLocked,
  notesKey,
  startUpdate,
  type UpdatePhase,
  useUpdate,
} from '@/lib/use-update';
import { cn } from '@/lib/utils';
import { ReleaseNotes } from './release-notes';

const CHANGELOG_URL = 'https://open-slide.dev/changelog';

export function WhatsNewDialog() {
  const t = useLocale();
  const update = useUpdate();
  const { dialog, phase } = update;
  const locked = isUpdateLocked();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const releases = update.notes[notesKey(dialog.from, dialog.to)];
  const offering = dialog.mode === 'available';

  const title =
    dialog.mode === 'updated'
      ? format(t.update.updatedTo, { version: dialog.to })
      : format(t.update.whatsNewIn, { version: dialog.to });

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!open) closeWhatsNew();
      }}
      disablePointerDismissal={locked}
    >
      <DialogContent
        showCloseButton={!locked}
        initialFocus={primaryRef}
        className="flex max-h-[min(760px,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]"
      >
        <div className="flex items-center gap-2.5 px-6 pt-5 pr-14 pb-4">
          {dialog.mode === 'updated' && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
          )}
          <DialogTitle className="text-[16px]">{title}</DialogTitle>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <ReleaseNotes releases={releases} />
        </div>

        <div className="border-t border-hairline bg-muted/40 px-4 py-3">
          {offering && locked ? (
            <UpdateProgress phase={phase} target={dialog.to} />
          ) : offering && phase === 'error' ? (
            <div className="flex items-end justify-between gap-3">
              <DialogDescription className="min-w-0 text-[12.5px] text-destructive">
                {update.failure === 'restart' ? t.update.restartFailed : t.update.failed}
                {update.error && (
                  <span className="mt-1 line-clamp-3 block font-mono text-[11px] leading-snug break-all text-muted-foreground">
                    {update.error}
                  </span>
                )}
              </DialogDescription>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="ghost" onClick={closeWhatsNew}>
                  {t.common.close}
                </Button>
                {update.failure === 'update' && (
                  <Button ref={primaryRef} size="sm" variant="brand" onClick={startUpdate}>
                    {t.common.tryAgain}
                  </Button>
                )}
              </div>
            </div>
          ) : offering && phase === 'done' ? (
            <div className="flex items-center justify-between gap-3">
              <DialogDescription className="text-[12.5px] text-foreground/85">
                {t.update.restartToFinish}
              </DialogDescription>
              <Button ref={primaryRef} size="sm" onClick={closeWhatsNew}>
                {t.update.gotIt}
              </Button>
            </div>
          ) : offering ? (
            <div className="flex items-center justify-between gap-3">
              <DialogDescription className="folio">
                v{config.version} → v{dialog.to}
              </DialogDescription>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={closeWhatsNew}>
                  {t.update.later}
                </Button>
                <Button ref={primaryRef} size="sm" variant="brand" onClick={startUpdate}>
                  {t.update.updateNow}
                  <CornerDownLeft className="size-3 opacity-70" aria-hidden />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <DialogDescription
                render={
                  <a
                    href={CHANGELOG_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
                  />
                }
              >
                {t.update.fullChangelog}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </DialogDescription>
              <Button ref={primaryRef} size="sm" onClick={closeWhatsNew}>
                {t.update.gotIt}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STEPS = ['installing', 'syncing', 'restarting'] as const satisfies readonly UpdatePhase[];

function UpdateProgress({ phase, target }: { phase: UpdatePhase; target: string }) {
  const t = useLocale();
  const active = STEPS.indexOf(phase as (typeof STEPS)[number]);
  const labels = [
    format(t.update.stepInstall, { version: target }),
    t.update.stepSync,
    t.update.stepRestart,
  ];

  return (
    <div className="flex flex-col gap-2.5 px-2 py-1" role="status" aria-live="polite">
      <ol className="flex items-center gap-2 text-[12px]">
        {labels.map((label, i) => (
          <li key={label} className="flex min-w-0 items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-4 shrink-0 bg-hairline" />}
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                i < active && 'border-foreground bg-foreground text-background',
                i === active && 'border-brand',
                i > active && 'border-foreground/20',
              )}
            >
              {i < active ? (
                <Check className="size-2.5" strokeWidth={3} aria-hidden />
              ) : (
                i === active && (
                  <span className="size-1.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
                )
              )}
            </span>
            <span
              className={cn(
                'truncate transition-colors duration-200',
                i === active ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <div className="relative h-px w-full overflow-hidden bg-hairline">
        <span
          aria-hidden
          className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
        />
      </div>
      <p className="text-[11.5px] leading-4 text-muted-foreground">{t.update.keepTabOpen}</p>
    </div>
  );
}
