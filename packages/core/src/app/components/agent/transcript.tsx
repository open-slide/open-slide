import { Check, ChevronRight, CircleAlert, Loader2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AgentItem, AgentSession, RespondPayload } from '@/lib/agent/use-agent';
import { format, plural, useLocale } from '@/lib/use-locale';
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
        {toBlocks(session.items).map((block) => (
          <li key={block.key}>
            {'tools' in block ? (
              <ToolGroup tools={block.tools} />
            ) : (
              <TranscriptItem
                item={block.item}
                onRespond={(payload) => onRespond(block.item.id, payload)}
              />
            )}
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

type ToolEntry = Extract<AgentItem, { kind: 'tool' }>;

type Block = { key: string; item: AgentItem } | { key: string; tools: ToolEntry[] };

function toBlocks(items: AgentItem[]): Block[] {
  const blocks: Block[] = [];
  for (const item of items) {
    const last = blocks.at(-1);
    if (item.kind === 'tool' && last && 'tools' in last) last.tools.push(item);
    else if (item.kind === 'tool') blocks.push({ key: item.id, tools: [item] });
    else blocks.push({ key: item.id, item });
  }
  return blocks;
}

function ToolRow({ item }: { item: ToolEntry }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-[11.5px] leading-5 text-muted-foreground">
      <span
        aria-hidden
        className={cn(
          'size-1 shrink-0 rounded-full',
          item.status === 'running'
            ? 'animate-pulse bg-foreground/70 motion-reduce:animate-none'
            : item.status === 'error'
              ? 'bg-destructive'
              : 'bg-muted-foreground/40',
        )}
      />
      <span
        className={cn(
          'shrink-0',
          item.status === 'running' && 'text-foreground/80',
          item.status === 'error' && 'text-destructive',
        )}
      >
        {item.title}
      </span>
      {item.detail && (
        <span
          className="min-w-0 truncate font-mono text-[10.5px] text-muted-foreground/70"
          title={item.detail}
        >
          {item.detail}
        </span>
      )}
    </div>
  );
}

function ToolGroup({ tools }: { tools: ToolEntry[] }) {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  if (tools.length === 1) return <ToolRow item={tools[0]} />;
  const live = [...tools].reverse().find((tool) => tool.status === 'running');
  const failed = tools.some((tool) => tool.status === 'error');
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-[4px] text-[11.5px] leading-5 text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <ChevronRight
          aria-hidden
          className={cn(
            'size-3 transition-transform duration-150 motion-reduce:transition-none',
            open && 'rotate-90',
          )}
        />
        {format(plural(tools.length, t.agent.steps), { count: tools.length })}
        {failed && <span aria-hidden className="ml-0.5 size-1 rounded-full bg-destructive" />}
      </button>
      {(open || live) && (
        <div className="mt-0.5 ml-1.5 flex flex-col border-l border-hairline pl-3">
          {open ? (
            tools.map((tool) => <ToolRow key={tool.id} item={tool} />)
          ) : live ? (
            <ToolRow item={live} />
          ) : null}
        </div>
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

  if (item.status !== 'pending') {
    return (
      <p className="flex min-w-0 items-center gap-2 text-[11.5px] leading-5 text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            'size-1 shrink-0 rounded-full',
            item.status === 'allowed' ? 'bg-muted-foreground/40' : 'bg-destructive',
          )}
        />
        <span className="shrink-0">
          {item.status === 'allowed' ? t.agent.allowed : t.agent.denied}
        </span>
        <span className="min-w-0 truncate text-foreground/70">{item.title}</span>
      </p>
    );
  }

  return (
    <div className="rounded-[8px] border border-hairline bg-background px-3 py-2.5">
      <p className="text-[11.5px] text-muted-foreground">{t.agent.permissionTitle}</p>
      <p className="mt-0.5 text-[12.5px] font-medium leading-snug">{item.title}</p>
      {item.detail && (
        <pre className="mt-1.5 line-clamp-4 whitespace-pre-wrap break-all font-mono text-[10.5px] leading-relaxed text-muted-foreground">
          {item.detail}
        </pre>
      )}
      <div className="mt-2.5 flex justify-end gap-1">
        <Button size="xs" variant="ghost" disabled={busy} onClick={() => decide(false)}>
          {t.agent.deny}
        </Button>
        <Button size="xs" disabled={busy} onClick={() => decide(true)}>
          {t.agent.allow}
        </Button>
      </div>
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

  const answerFor = (q: AgentQuestion): string | null => {
    const custom = other[q.question]?.trim();
    const chosen = picked[q.question] ?? [];
    const parts = [...chosen, ...(custom ? [custom] : [])];
    return parts.length ? parts.join(', ') : null;
  };
  const complete = item.questions.every((q) => answerFor(q) !== null);

  const reply = async (payload: RespondPayload) => {
    setBusy(true);
    try {
      await onRespond(payload);
    } finally {
      setBusy(false);
    }
  };
  const submit = () => {
    const answers: Record<string, string> = {};
    for (const q of item.questions) answers[q.question] = answerFor(q) ?? '';
    void reply({ answers });
  };
  const toggle = (q: AgentQuestion, label: string) =>
    setPicked((prev) => {
      const current = prev[q.question] ?? [];
      const on = current.includes(label);
      const next = q.multiSelect
        ? on
          ? current.filter((l) => l !== label)
          : [...current, label]
        : on
          ? []
          : [label];
      return { ...prev, [q.question]: next };
    });

  if (item.status !== 'pending') {
    return (
      <div className="flex flex-col gap-0.5">
        {item.questions.map((q) => (
          <p key={q.question} className="text-[11.5px] leading-5 text-muted-foreground">
            <span>{q.header || q.question}</span>
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <span className="text-foreground/80">
              {item.status === 'answered'
                ? item.answers?.[q.question] || '—'
                : t.agent.questionCancelled}
            </span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-hairline bg-background px-1.5 pt-2.5 pb-2">
      <div className="flex flex-col gap-3">
        {item.questions.map((q) => (
          <fieldset key={q.question} className="min-w-0">
            <legend className="px-1.5 text-[12.5px] font-medium leading-snug">{q.question}</legend>
            <div className="mt-1 flex flex-col">
              {q.options.map((option) => {
                const selected = (picked[q.question] ?? []).includes(option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(q, option.label)}
                    className="flex items-start gap-2 rounded-[5px] px-1.5 py-1 text-left outline-none transition-colors duration-100 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-[3px] grid size-3 shrink-0 place-items-center border transition-colors duration-100',
                        q.multiSelect ? 'rounded-[3px]' : 'rounded-full',
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-muted-foreground/40',
                      )}
                    >
                      {selected && <Check className="size-2" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] leading-snug">{option.label}</span>
                      {option.description && (
                        <span className="block text-[11px] leading-snug text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
              <input
                value={other[q.question] ?? ''}
                onChange={(e) => setOther((prev) => ({ ...prev, [q.question]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && complete && !busy) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={`${t.agent.questionOther}…`}
                aria-label={t.agent.questionOtherPlaceholder}
                className="mx-1.5 mt-1 h-7 border-b border-hairline bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60 focus-visible:border-foreground/40"
              />
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-2.5 flex justify-end gap-1 px-1">
        <Button size="xs" variant="ghost" disabled={busy} onClick={() => reply({ cancel: true })}>
          {t.agent.questionSkip}
        </Button>
        <Button size="xs" disabled={busy || !complete} onClick={submit}>
          {t.agent.questionSubmit}
        </Button>
      </div>
    </div>
  );
}
