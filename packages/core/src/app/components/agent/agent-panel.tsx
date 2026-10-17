import {
  ChevronDown,
  History,
  MessageSquare,
  Palette,
  Pencil,
  Plus,
  Presentation,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AgentProviderId,
  consumeRequest,
  createSession,
  deleteSession,
  type RespondPayload,
  readyProviders,
  respond,
  sendMessage,
  setActiveSession,
  setAutoApprove,
  setPreferredProvider,
  stopSession,
  useAgentSession,
  useAgentSessions,
  useAgentState,
  useAgentStatus,
} from '@/lib/agent/use-agent';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { applyCommentsPrompt, createSlidePrompt } from '../../../agent/prompt';
import type { AgentTurnContext } from '../../../agent/types';
import { Composer, ContextChip } from './composer';
import { ConnectView } from './connect-view';
import { Transcript } from './transcript';

const CREATE_THEME_PROMPT =
  'Use the create-theme skill to create a reusable theme. Ask me what it should look like first.';

export function AgentPanel({
  context,
  onClose,
  className,
}: {
  context?: AgentTurnContext;
  onClose?: () => void;
  className?: string;
}) {
  const t = useLocale();
  const { status, loading, connected, provider } = useAgentStatus();
  const { sessions, activeId } = useAgentSessions();
  const session = useAgentSession(activeId);
  const { request, autoApprove } = useAgentState();
  const [draft, setDraft] = useState('');
  const [manage, setManage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const running = session?.status === 'running';
  const showConnect = !loading && (!connected || manage);

  const contextRef = useRef(context);
  contextRef.current = context;

  const ensureSession = useCallback(
    async (fresh: boolean) => {
      const current = activeId ? sessions.find((s) => s.id === activeId) : null;
      if (!fresh && current && current.status !== 'running') return current.id;
      if (!provider) throw new Error('no agent connected');
      const created = await createSession(provider.id, contextRef.current?.slideId ?? null);
      return created.id;
    },
    [activeId, sessions, provider],
  );

  const send = useCallback(
    async (text: string, fresh = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        const id = await ensureSession(fresh);
        setDraft('');
        await sendMessage(id, trimmed, contextRef.current);
      } catch (err) {
        toast.error(t.agent.toastSendFailed, {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [ensureSession, t],
  );

  useEffect(() => {
    if (!request || loading || !connected) return;
    const req = consumeRequest();
    if (!req) return;
    setManage(false);
    if (req.send) void send(req.text, req.newSession);
    else {
      setDraft(req.text);
      queueMicrotask(() => textareaRef.current?.focus());
    }
  }, [request, loading, connected, send]);

  const onRespond = useCallback(
    async (itemId: string, payload: RespondPayload) => {
      if (!session) return;
      try {
        await respond(session.id, itemId, payload);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [session],
  );

  const providerName = provider?.name ?? '';
  const pendingComments = context?.pendingComments ?? 0;

  const chips: ReactNode = context?.slideId ? (
    <>
      <ContextChip title={context.slideId}>
        {context.slideTitle ?? context.slideId}
        {context.pageNumber ? ` · ${format(t.agent.contextPage, { n: context.pageNumber })}` : ''}
      </ContextChip>
      {context.selection && (
        <ContextChip title={context.selection.text || undefined}>
          {`<${context.selection.tagName}>`} {t.agent.contextSelection}
        </ContextChip>
      )}
      {pendingComments > 0 && (
        <ContextChip
          tone="brand"
          title={t.agent.quickApplyHint}
          onClick={() => context.slideId && send(applyCommentsPrompt(context.slideId))}
        >
          {format(plural(pendingComments, t.agent.pendingComments), { count: pendingComments })} ·{' '}
          {t.agent.applyComments}
        </ContextChip>
      )}
    </>
  ) : null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-sidebar', className)}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-1 border-b border-hairline px-2">
        <div className="flex min-w-0 items-center gap-0.5">
          {showConnect && connected ? (
            <Button size="xs" variant="ghost" onClick={() => setManage(false)}>
              {t.agent.backToChat}
            </Button>
          ) : (
            <ProviderMenu
              status={status}
              providerId={provider?.id ?? null}
              providerName={providerName || t.agent.title}
              autoApprove={autoApprove}
              onManage={() => setManage(true)}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {connected && !showConnect && (
            <>
              <SessionsMenu
                sessions={sessions}
                activeId={activeId}
                onSelect={(id) => setActiveSession(id)}
                onDelete={async (id) => {
                  try {
                    await deleteSession(id);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : String(err));
                  }
                }}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t.agent.newSession}
                title={t.agent.newSession}
                onClick={() => {
                  setActiveSession(null);
                  setDraft('');
                  queueMicrotask(() => textareaRef.current?.focus());
                }}
              >
                <Plus className="size-3.5" />
              </Button>
            </>
          )}
          {onClose && (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t.agent.close}
              title={t.agent.close}
              onClick={onClose}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <p className="px-4 py-5 text-[12px] text-muted-foreground">{t.agent.statusLoading}…</p>
      ) : showConnect ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConnectView />
        </div>
      ) : (
        <>
          {session && session.items.length > 0 ? (
            <Transcript session={session} onRespond={onRespond} />
          ) : (
            <EmptyState
              pendingComments={pendingComments}
              hasSlide={Boolean(context?.slideId)}
              onCreate={() => send(createSlidePrompt(''), true)}
              onApply={() => context?.slideId && send(applyCommentsPrompt(context.slideId))}
              onTheme={() => send(CREATE_THEME_PROMPT, true)}
              onEdit={() => textareaRef.current?.focus()}
            />
          )}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => send(draft)}
            onStop={() => session && stopSession(session.id).catch(() => {})}
            running={Boolean(running)}
            placeholder={format(t.agent.composerPlaceholder, { provider: providerName })}
            chips={chips}
            textareaRef={textareaRef}
          />
        </>
      )}
    </div>
  );
}

function ProviderMenu({
  status,
  providerId,
  providerName,
  autoApprove,
  onManage,
}: {
  status: ReturnType<typeof useAgentStatus>['status'];
  providerId: AgentProviderId | null;
  providerName: string;
  autoApprove: boolean;
  onManage: () => void;
}) {
  const t = useLocale();
  const ready = readyProviders(status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="flex h-7 min-w-0 items-center gap-1.5 rounded-[5px] px-2 text-[12.5px] font-medium outline-none transition-colors duration-100 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted"
      >
        <span aria-hidden className="relative flex size-1.5 items-center justify-center">
          <span
            className={cn(
              'relative inline-flex size-1.5 rounded-full',
              providerId ? 'bg-emerald-500' : 'bg-muted-foreground/50',
            )}
          />
        </span>
        <span className="truncate">{providerName}</span>
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {ready.length > 0 && (
          <>
            <DropdownMenuRadioGroup
              value={providerId ?? ''}
              onValueChange={(value) => {
                if (value === 'claude' || value === 'codex') setPreferredProvider(value);
              }}
            >
              {ready.map((p) => (
                <DropdownMenuRadioItem key={p.id} value={p.id}>
                  {p.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={autoApprove} onCheckedChange={setAutoApprove}>
              <div className="flex flex-col">
                <span>{t.agent.autoApprove}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {t.agent.autoApproveHint}
                </span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onManage}>
          <Settings2 />
          {t.agent.manageConnections}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SessionsMenu({
  sessions,
  activeId,
  onSelect,
  onDelete,
}: {
  sessions: ReturnType<typeof useAgentSessions>['sessions'];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={t.agent.sessions}
        title={t.agent.sessions}
        className="flex size-7 items-center justify-center rounded-[5px] text-foreground/75 outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <History className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[320px] min-w-[240px] overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">{t.agent.noSessions}</div>
        ) : (
          <DropdownMenuGroup>
            {sessions.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn('group/session', s.id === activeId && 'bg-muted text-foreground')}
              >
                <MessageSquare className="text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.status === 'running' && (
                  <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={t.agent.deleteSession}
                  title={t.agent.deleteSession}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(s.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(s.id);
                    }
                  }}
                  className="ml-1 grid size-5 shrink-0 place-items-center rounded-[4px] text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover/session:opacity-100 group-focus/session:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  pendingComments,
  hasSlide,
  onCreate,
  onApply,
  onTheme,
  onEdit,
}: {
  pendingComments: number;
  hasSlide: boolean;
  onCreate: () => void;
  onApply: () => void;
  onTheme: () => void;
  onEdit: () => void;
}) {
  const t = useLocale();
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-4 py-5">
      <span className="eyebrow">{t.agent.title}</span>
      <h2 className="mt-1.5 font-heading text-[15px] font-semibold tracking-tight">
        {t.agent.emptyTitle}
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{t.agent.emptyHint}</p>
      <div className="mt-4 flex flex-col gap-1.5">
        {hasSlide && pendingComments > 0 && (
          <QuickAction
            icon={<MessageSquare />}
            label={`${t.agent.quickApply} · ${format(plural(pendingComments, t.agent.pendingComments), { count: pendingComments })}`}
            hint={t.agent.quickApplyHint}
            tone="brand"
            onClick={onApply}
          />
        )}
        {hasSlide && (
          <QuickAction
            icon={<Pencil />}
            label={t.agent.quickEdit}
            hint={t.agent.quickEditHint}
            onClick={onEdit}
          />
        )}
        <QuickAction
          icon={<Presentation />}
          label={t.agent.quickCreate}
          hint={t.agent.quickCreateHint}
          onClick={onCreate}
        />
        <QuickAction
          icon={<Palette />}
          label={t.agent.quickTheme}
          hint={t.agent.quickThemeHint}
          onClick={onTheme}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  hint,
  tone = 'default',
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  tone?: 'default' | 'brand';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-2.5 rounded-[8px] border px-3 py-2.5 text-left outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring/30',
        tone === 'brand'
          ? 'border-brand/40 bg-brand/[0.06] hover:bg-brand/[0.1]'
          : 'border-border bg-card hover:border-foreground/25 hover:bg-muted/40',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center [&_svg]:size-3.5',
          tone === 'brand' ? 'text-brand' : 'text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
