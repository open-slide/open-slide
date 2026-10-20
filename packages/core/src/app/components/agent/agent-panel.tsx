import {
  ChevronDown,
  ChevronLeft,
  History,
  MessageSquare,
  Palette,
  Pencil,
  Plus,
  Presentation,
  Settings2,
  X,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AgentEffort,
  type AgentModelOption,
  type AgentProviderId,
  autoConnect,
  clearNewDeck,
  consumeRequest,
  createSession,
  deleteSession,
  type RespondPayload,
  readyProviders,
  respond,
  sendMessage,
  setActiveSession,
  setAutoApprove,
  setModelChoice,
  startBlankDeck,
  stopSession,
  useAgentSession,
  useAgentSessions,
  useAgentState,
  useAgentStatus,
} from '@/lib/agent/use-agent';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { applyCommentsPrompt } from '../../../agent/prompt';
import type { AgentTurnContext } from '../../../agent/types';
import { Composer, ContextChip } from './composer';
import { ConnectView } from './connect-view';
import { HistoryView } from './history-view';
import { ProviderLogo } from './provider-logo';
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
  const { status, loading, connected, provider, model, effort, modelChoices } = useAgentStatus();
  const { sessions, activeId } = useAgentSessions();
  const session = useAgentSession(activeId);
  const { request, autoApprove, newDeck } = useAgentState();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [manage, setManage] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const running = session?.status === 'running';
  const showConnect = !loading && (!connected || manage);

  useEffect(() => {
    if (status) void autoConnect();
  }, [status]);

  const contextRef = useRef(context);
  contextRef.current = context;
  const isNewDeck = Boolean(context?.slideId) && newDeck === context?.slideId;

  const ensureSession = useCallback(
    async (fresh: boolean) => {
      const current = activeId ? sessions.find((s) => s.id === activeId) : null;
      if (!provider) throw new Error('no agent connected');
      if (!fresh && current && current.status !== 'running' && current.provider === provider.id) {
        return current.id;
      }
      const created = await createSession(provider.id, contextRef.current?.slideId ?? null);
      return created.id;
    },
    [activeId, sessions, provider],
  );

  const send = useCallback(
    async (text: string, fresh = false) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;
      sendingRef.current = true;
      setSending(true);
      try {
        const id = await ensureSession(fresh || isNewDeck);
        setDraft('');
        await sendMessage(
          id,
          trimmed,
          isNewDeck ? { ...contextRef.current, newDeck: true } : contextRef.current,
        );
        if (isNewDeck) clearNewDeck();
      } catch (err) {
        toast.error(t.agent.toastSendFailed, {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [ensureSession, isNewDeck, t],
  );

  const createDeck = useCallback(async () => {
    try {
      await startBlankDeck();
    } catch (err) {
      toast.error(t.agent.toastCreateDeckFailed, {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }, [t]);

  useEffect(() => {
    if (isNewDeck && connected) textareaRef.current?.focus();
  }, [isNewDeck, connected]);

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
    <div
      data-agent-provider={provider?.id}
      className={cn('relative flex h-full min-h-0 flex-col bg-sidebar', className)}
    >
      {running && <span aria-hidden className="agent-progress z-10" />}
      <header className="flex h-9 shrink-0 items-center justify-between gap-1 border-b border-hairline px-2">
        <div className="flex min-w-0 items-center gap-0.5">
          {showConnect && connected ? (
            <Button size="xs" variant="ghost" onClick={() => setManage(false)}>
              {t.agent.backToChat}
            </Button>
          ) : view === 'history' ? (
            <Button size="xs" variant="ghost" onClick={() => setView('chat')}>
              <ChevronLeft className="size-3.5" />
              {t.agent.sessions}
            </Button>
          ) : (
            <ModelMenu
              status={status}
              providerId={provider?.id ?? null}
              model={model}
              effort={effort}
              modelChoices={modelChoices}
              autoApprove={autoApprove}
              onManage={() => setManage(true)}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {connected && !showConnect && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t.agent.sessions}
                aria-pressed={view === 'history'}
                title={t.agent.sessions}
                className="aria-pressed:bg-muted aria-pressed:text-foreground"
                onClick={() => setView((v) => (v === 'history' ? 'chat' : 'history'))}
              >
                <History className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t.agent.newSession}
                title={t.agent.newSession}
                onClick={() => {
                  setActiveSession(null);
                  setView('chat');
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
      ) : view === 'history' ? (
        <HistoryView
          sessions={sessions}
          activeId={activeId}
          slideId={context?.slideId ?? null}
          onSelect={(s) => {
            setActiveSession(s.id);
            setView('chat');
            if (s.slideId && s.slideId !== context?.slideId) navigate(`/s/${s.slideId}`);
          }}
          onDelete={async (id) => {
            try {
              await deleteSession(id);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      ) : (
        <>
          {session && session.items.length > 0 ? (
            <Transcript session={session} onRespond={onRespond} />
          ) : isNewDeck ? (
            <NewDeckState providerName={providerName} />
          ) : (
            <EmptyState
              pendingComments={pendingComments}
              hasSlide={Boolean(context?.slideId)}
              onCreate={createDeck}
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
            busy={sending}
            placeholder={
              isNewDeck
                ? t.agent.newDeckPlaceholder
                : format(t.agent.composerPlaceholder, { provider: providerName })
            }
            chips={chips}
            textareaRef={textareaRef}
          />
        </>
      )}
    </div>
  );
}

function modelLabel(model: AgentModelOption, t: ReturnType<typeof useLocale>): string {
  return model.id ? model.label : t.agent.modelDefault;
}

function ModelMenu({
  status,
  providerId,
  model,
  effort,
  modelChoices,
  autoApprove,
  onManage,
}: {
  status: ReturnType<typeof useAgentStatus>['status'];
  providerId: AgentProviderId | null;
  model: AgentModelOption | null;
  effort: AgentEffort | null;
  modelChoices: ReturnType<typeof useAgentStatus>['modelChoices'];
  autoApprove: boolean;
  onManage: () => void;
}) {
  const t = useLocale();
  const providers = status?.enabled ? status.providers : [];
  const ready = readyProviders(status);
  const value = providerId && model ? `${providerId}:${model.id}` : '';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="flex h-7 min-w-0 items-center gap-1.5 rounded-[5px] px-2 text-[12.5px] font-medium outline-none transition-colors duration-100 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted"
      >
        {providerId ? (
          <ProviderLogo provider={providerId} className="size-3.5 shrink-0" />
        ) : (
          <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/50" />
        )}
        <span className="truncate">{model ? modelLabel(model, t) : t.agent.title}</span>
        {effort && (
          <span className="shrink-0 font-normal text-muted-foreground">
            {t.agent.efforts[effort]}
          </span>
        )}
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[232px]">
        {ready.length > 0 && (
          <>
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={(next) => {
                const [id, ...rest] = String(next).split(':');
                if (id !== 'claude' && id !== 'codex') return;
                const prev = modelChoices[id];
                setModelChoice(id, { model: rest.join(':'), effort: prev?.effort ?? null });
              }}
            >
              {providers.map((p) => (
                <DropdownMenuGroup key={p.id}>
                  <DropdownMenuLabel className="flex items-center gap-1.5">
                    <ProviderLogo provider={p.id} className="size-3" />
                    {p.name}
                  </DropdownMenuLabel>
                  {p.ready ? (
                    p.models.map((m) => (
                      <DropdownMenuRadioItem key={m.id} value={`${p.id}:${m.id}`}>
                        {modelLabel(m, t)}
                      </DropdownMenuRadioItem>
                    ))
                  ) : (
                    <DropdownMenuItem onClick={onManage} className="pl-8 text-muted-foreground">
                      {t.agent.connect}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuRadioGroup>
            {providerId && model && model.efforts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t.agent.reasoning}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={effort ?? ''}
                    onValueChange={(next) =>
                      setModelChoice(providerId, {
                        model: model.id,
                        effort: next ? (next as AgentEffort) : null,
                      })
                    }
                  >
                    <DropdownMenuRadioItem value="">{t.agent.effortAuto}</DropdownMenuRadioItem>
                    {model.efforts.map((e) => (
                      <DropdownMenuRadioItem key={e} value={e}>
                        {t.agent.efforts[e]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </>
            )}
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

function NewDeckState({ providerName }: { providerName: string }) {
  const t = useLocale();
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-4 py-5">
      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
        {t.agent.newDeckTitle}
      </h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        {format(t.agent.newDeckHint, { provider: providerName })}
      </p>
    </div>
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
