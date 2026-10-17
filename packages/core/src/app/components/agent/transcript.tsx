import { Check, CircleAlert, Loader2, Wrench, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AgentItem, AgentSession, RespondPayload } from '@/lib/agent/use-agent';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { AgentQuestion } from '../../../agent/types';
import { AgentMarkdown } from './agent-markdown';

export function Transcript({
  session,
  onRespond,
}: {
  session: AgentSession;
  onRespond: (itemId: string, payload: RespondPayload) => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastItem = session.items.at(-1);
  const lastText = lastItem?.kind === 'assistant' ? lastItem.text.length : 0;

  // Follow the stream while the user is parked at the bottom; stop once they
  // scroll up to read, like a terminal.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run as the transcript grows or streams
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || !stickRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [session.items.length, lastText, session.status]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const node = e.currentTarget;
        stickRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
      }}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
    >
      <ol className="flex flex-col gap-3">
        {session.items.map((item) => (
          <li key={item.id}>
            <TranscriptItem item={item} onRespond={(payload) => onRespond(item.id, payload)} />
          </li>
        ))}
        {session.status === 'running' &&
          !(lastItem?.kind === 'assistant' && lastItem.streaming) && (
            <li>
              <WorkingIndicator />
            </li>
          )}
      </ol>
    </div>
  );
}

function WorkingIndicator() {
  const t = useLocale();
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
      <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />
      {t.agent.working}…
    </div>
  );
}

function TranscriptItem({
  item,
  onRespond,
}: {
  item: AgentItem;
  onRespond: (payload: RespondPayload) => Promise<void>;
}) {
  switch (item.kind) {
    case 'user':
      return <UserItem text={item.text} />;
    case 'assistant':
      return item.text || !item.streaming ? (
        <AgentMarkdown text={item.text} />
      ) : (
        <WorkingIndicator />
      );
    case 'tool':
      return <ToolItem item={item} />;
    case 'question':
      return <QuestionItem item={item} onRespond={onRespond} />;
    case 'permission':
      return <PermissionItem item={item} onRespond={onRespond} />;
    case 'error':
      return <ErrorItem text={item.text} />;
    case 'result':
      return <ResultItem item={item} />;
    default:
      return null;
  }
}

function UserItem({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] whitespace-pre-wrap rounded-[8px] rounded-br-[3px] bg-muted px-3 py-2 text-[12.5px] leading-[1.5]">
        {text}
      </div>
    </div>
  );
}

function ToolItem({ item }: { item: Extract<AgentItem, { kind: 'tool' }> }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
      <span className="grid size-4 shrink-0 place-items-center">
        {item.status === 'running' ? (
          <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : item.status === 'done' ? (
          <Check className="size-3" aria-hidden />
        ) : (
          <X className="size-3 text-destructive" aria-hidden />
        )}
      </span>
      <span className="shrink-0 font-medium text-foreground/80">{item.title}</span>
      {item.detail && (
        <span className="min-w-0 truncate font-mono text-[11px]" title={item.detail}>
          {item.detail}
        </span>
      )}
    </div>
  );
}

function ErrorItem({ text }: { text: string }) {
  const t = useLocale();
  return (
    <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 px-3 py-2">
      <span className="eyebrow flex items-center gap-1 text-destructive/80">
        <CircleAlert className="size-3" aria-hidden />
        {t.agent.errorEyebrow}
      </span>
      <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/85">
        {text}
      </pre>
    </div>
  );
}

function ResultItem({ item }: { item: Extract<AgentItem, { kind: 'result' }> }) {
  const t = useLocale();
  const parts = [item.aborted ? t.agent.resultStopped : t.agent.resultDone];
  if (item.durationMs !== null) {
    parts.push(
      format(t.agent.resultSeconds, { seconds: Math.max(1, Math.round(item.durationMs / 1000)) }),
    );
  }
  if (item.costUsd !== null && item.costUsd > 0) parts.push(`$${item.costUsd.toFixed(2)}`);
  return <p className="folio text-muted-foreground/70">{parts.join(' · ')}</p>;
}

function PermissionItem({
  item,
  onRespond,
}: {
  item: Extract<AgentItem, { kind: 'permission' }>;
  onRespond: (payload: RespondPayload) => Promise<void>;
}) {
  const t = useLocale();
  const [busy, setBusy] = useState(false);
  const decide = async (allow: boolean) => {
    setBusy(true);
    try {
      await onRespond({ allow });
    } finally {
      setBusy(false);
    }
  };
  const pending = item.status === 'pending';
  return (
    <div
      className={cn(
        'rounded-[6px] border px-3 py-2.5',
        pending ? 'border-amber-500/40 bg-amber-500/5' : 'border-hairline bg-card',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow flex items-center gap-1">
          <Wrench className="size-3" aria-hidden />
          {pending
            ? t.agent.permissionTitle
            : item.status === 'allowed'
              ? t.agent.allowed
              : t.agent.denied}
        </span>
        {pending && (
          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" disabled={busy} onClick={() => decide(false)}>
              {t.agent.deny}
            </Button>
            <Button size="xs" disabled={busy} onClick={() => decide(true)}>
              {t.agent.allow}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-1 text-[12px] font-medium">{item.title}</p>
      {item.detail && (
        <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
          {item.detail}
        </pre>
      )}
    </div>
  );
}

function QuestionItem({
  item,
  onRespond,
}: {
  item: Extract<AgentItem, { kind: 'question' }>;
  onRespond: (payload: RespondPayload) => Promise<void>;
}) {
  const t = useLocale();
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const pending = item.status === 'pending';

  const answerFor = (q: AgentQuestion): string | null => {
    const custom = other[q.question]?.trim();
    const chosen = picked[q.question] ?? [];
    const parts = [...chosen, ...(custom ? [custom] : [])];
    return parts.length ? parts.join(', ') : null;
  };
  const complete = item.questions.every((q) => answerFor(q) !== null);

  const submit = async () => {
    const answers: Record<string, string> = {};
    for (const q of item.questions) answers[q.question] = answerFor(q) ?? '';
    setBusy(true);
    try {
      await onRespond({ answers });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-[8px] border px-3 py-3',
        pending ? 'border-brand/40 bg-brand/[0.04]' : 'border-hairline bg-card',
      )}
    >
      <div className="flex flex-col gap-3.5">
        {item.questions.map((q) => (
          <div key={q.question}>
            {q.header && <span className="eyebrow">{q.header}</span>}
            <p className="mt-0.5 text-[12.5px] font-medium leading-snug">{q.question}</p>
            {pending ? (
              <>
                <div className="mt-2 flex flex-col gap-1">
                  {q.options.map((option) => {
                    const selected = (picked[q.question] ?? []).includes(option.label);
                    return (
                      <button
                        key={option.label}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setPicked((prev) => {
                            const current = prev[q.question] ?? [];
                            const next = q.multiSelect
                              ? selected
                                ? current.filter((l) => l !== option.label)
                                : [...current, option.label]
                              : selected
                                ? []
                                : [option.label];
                            return { ...prev, [q.question]: next };
                          })
                        }
                        className={cn(
                          'rounded-[6px] border px-2.5 py-1.5 text-left outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring/30',
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background hover:border-foreground/30',
                        )}
                      >
                        <span className="block text-[12px] font-medium">{option.label}</span>
                        {option.description && (
                          <span
                            className={cn(
                              'mt-0.5 block text-[11px] leading-snug',
                              selected ? 'text-background/75' : 'text-muted-foreground',
                            )}
                          >
                            {option.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={other[q.question] ?? ''}
                  onChange={(e) => setOther((prev) => ({ ...prev, [q.question]: e.target.value }))}
                  placeholder={`${t.agent.questionOther} · ${t.agent.questionOtherPlaceholder}`}
                  className="mt-1.5 h-8 w-full rounded-[6px] border border-border bg-background px-2.5 text-[12px] outline-none placeholder:text-muted-foreground/60 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </>
            ) : (
              <p className="mt-1 text-[12px] text-muted-foreground">
                {item.status === 'answered'
                  ? (item.answers?.[q.question] ?? '—')
                  : t.agent.questionCancelled}
              </p>
            )}
          </div>
        ))}
      </div>
      {pending && (
        <div className="mt-3 flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onRespond({ cancel: true })}
          >
            {t.common.cancel}
          </Button>
          <Button size="sm" disabled={busy || !complete} onClick={submit}>
            {t.agent.questionSubmit}
          </Button>
        </div>
      )}
    </div>
  );
}
