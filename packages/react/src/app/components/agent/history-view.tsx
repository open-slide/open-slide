import { Check, MessageSquare, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useLocale } from '@/lib/use-locale';
import { useSlideTitles } from '@/lib/use-slide-titles';
import { cn } from '@/lib/utils';
import type { AgentSessionSummary } from '../../../agent/types';
import { ProviderLogo } from './provider-logo';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

function relativeTime(iso: string, locale: string, now: number): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, 'second');
}

export function HistoryView({
  sessions,
  activeId,
  slideId,
  onSelect,
  onDelete,
}: {
  sessions: AgentSessionSummary[];
  activeId: string | null;
  slideId: string | null;
  onSelect: (session: AgentSessionSummary) => void;
  onDelete: (id: string) => void;
}) {
  const t = useLocale();
  const groups = useMemo(() => {
    if (!slideId) return [{ id: 'all', label: null, items: sessions }];
    return [
      {
        id: 'here',
        label: t.agent.historyThisDeck,
        items: sessions.filter((s) => s.slideId === slideId),
      },
      {
        id: 'other',
        label: t.agent.historyOtherDecks,
        items: sessions.filter((s) => s.slideId !== slideId),
      },
    ].filter((g) => g.items.length > 0);
  }, [sessions, slideId, t]);
  const showDeck = groups.some((g) => g.id !== 'here');
  const titles = useSlideTitles(showDeck && sessions.some((s) => s.slideId));
  const now = Date.now();

  if (sessions.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <MessageSquare className="size-5 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
        <p className="text-[12.5px] font-medium">{t.agent.noSessions}</p>
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          {t.agent.historyEmptyHint}
        </p>
      </div>
    );
  }

  return (
    <div data-agent-history className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
      {groups.map((group) => (
        <section key={group.id} className="mb-2 last:mb-0">
          {group.label && <h3 className="eyebrow px-2 pt-1.5 pb-1">{group.label}</h3>}
          <ul className="flex flex-col gap-px">
            {group.items.map((s) => {
              const active = s.id === activeId;
              const running = s.status === 'running';
              const deck =
                group.id !== 'here' && s.slideId ? (titles[s.slideId] ?? s.slideId) : null;
              return (
                <li key={s.id} className="group/session relative">
                  <button
                    type="button"
                    onClick={() => onSelect(s)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full flex-col gap-0.5 rounded-[6px] py-2 pr-9 pl-2.5 text-left outline-none transition-colors duration-100 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                      active && 'bg-muted',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium">
                      <span className="min-w-0 truncate">{s.title}</span>
                      {active && (
                        <Check className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <ProviderLogo provider={s.provider} className="size-3 shrink-0" />
                      {running ? (
                        <span className="agent-shimmer shrink-0">{t.agent.sessionRunning}</span>
                      ) : (
                        <span className="shrink-0 tabular-nums">
                          {relativeTime(s.updatedAt, t.id, now)}
                        </span>
                      )}
                      {deck && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="min-w-0 truncate">{deck}</span>
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t.agent.deleteSession}
                    title={t.agent.deleteSession}
                    disabled={running}
                    onClick={() => onDelete(s.id)}
                    className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-[5px] text-muted-foreground opacity-0 outline-none transition-opacity duration-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:hidden group-hover/session:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
