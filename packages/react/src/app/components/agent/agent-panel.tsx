import {
  Check,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  autoConnect,
  clearNewDeck,
  consumeRequest,
  createSession,
  deleteSession,
  readyProviders,
  resolveModelChoice,
  respond,
  sendMessage,
  setActiveSession,
  setAutoApprove,
  setModelChoice,
  stopSession,
  useAgentSession,
  useAgentSessions,
  useAgentState,
  useAgentStatus,
  useCreateDeck,
} from '@/lib/agent/use-agent';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { applyCommentsPrompt } from '../../../agent/prompt';
import type {
  AgentEffort,
  AgentModelOption,
  AgentProviderId,
  AgentTurnContext,
  RespondPayload,
} from '../../../agent/types';
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
}: {
  context: AgentTurnContext;
  onClose: () => void;
}) {
  const t = useLocale();
  const { status, loading, connected, provider, model, effort, modelChoices } = useAgentStatus();
  const { sessions, loaded: sessionsLoaded, activeId } = useAgentSessions();
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

  // Arriving at another deck starts a new conversation; the previous one stays
  // in history. Picking a chat from history navigates to its own deck, so it
  // survives this check.
  const slideId = context.slideId ?? null;
  const checkedSlideRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!sessionsLoaded || checkedSlideRef.current === slideId) return;
    checkedSlideRef.current = slideId;
    const active = activeId ? sessions.find((s) => s.id === activeId) : null;
    if (active?.slideId && active.slideId !== slideId) setActiveSession(null);
  }, [slideId, sessionsLoaded, activeId, sessions]);
  const isNewDeck = Boolean(context.slideId) && newDeck === context.slideId;

  const ensureSession = useCallback(
    async (fresh: boolean) => {
      const current = activeId ? sessions.find((s) => s.id === activeId) : null;
      if (!provider) throw new Error('no agent connected');
      if (!fresh && current && current.status !== 'running' && current.provider === provider.id) {
        return current.id;
      }
      const created = await createSession(provider.id, contextRef.current.slideId ?? null);
      return created.id;
    },
    [activeId, sessions, provider],
  );

  const send = useCallback(
    async (text: string, fresh = false) => {
      const trimmed = text.trim();
      // A second agent would edit the same deck alongside the running one.
      if (!trimmed || sendingRef.current || (running && !fresh)) return;
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
    [ensureSession, isNewDeck, running, t],
  );

  const createDeck = useCreateDeck();

  useEffect(() => {
    if (isNewDeck && connected) textareaRef.current?.focus();
  }, [isNewDeck, connected]);

  // A request made while a turn runs waits for it to end, then joins the same
  // conversation.
  useEffect(() => {
    if (!request || loading || !connected || running) return;
    const req = consumeRequest();
    if (!req) return;
    setManage(false);
    void send(req.text);
  }, [request, loading, connected, running, send]);

  const onRespond = useCallback(
    async (itemId: string, payload: RespondPayload) => {
      if (!session) return;
      try {
        await respond(session.id, itemId, payload, contextRef.current);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [session],
  );

  const providerName = provider?.name ?? '';
  const onEdit = useCallback(
    async (itemId: string, text: string) => {
      if (!session) return;
      try {
        await sendMessage(session.id, text, contextRef.current, itemId);
      } catch (err) {
        toast.error(t.agent.toastSendFailed, {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [session, t],
  );

  const pendingComments = context.pendingComments ?? 0;

  const chips: ReactNode = context.slideId ? (
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
          onClick={
            running
              ? undefined
              : () => context.slideId && send(applyCommentsPrompt(context.slideId))
          }
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
      className="relative flex h-full min-h-0 flex-col bg-sidebar"
    >
      {running && <span aria-hidden className="agent-progress z-10" />}
      <header className="relative z-10 flex h-9 shrink-0 items-center justify-between gap-1 bg-sidebar px-2">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full h-5 bg-gradient-to-b from-sidebar to-transparent"
        />
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
          <BetaBadge />
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
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t.agent.close}
            title={t.agent.close}
            onClick={onClose}
          >
            <X className="size-3.5" />
          </Button>
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
          slideId={context.slideId ?? null}
          onSelect={(s) => {
            setActiveSession(s.id);
            setView('chat');
            if (s.slideId && s.slideId !== context.slideId) navigate(`/s/${s.slideId}`);
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
            <Transcript session={session} onRespond={onRespond} onEdit={onEdit} />
          ) : isNewDeck ? (
            <NewDeckState providerName={providerName} />
          ) : (
            <EmptyState
              pendingComments={pendingComments}
              hasSlide={Boolean(context.slideId)}
              onCreate={createDeck}
              onApply={() => context.slideId && send(applyCommentsPrompt(context.slideId))}
              onTheme={() => send(CREATE_THEME_PROMPT, true)}
              onEdit={() => textareaRef.current?.focus()}
            />
          )}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => send(draft)}
            onStop={() =>
              session &&
              stopSession(session.id).catch((err) => {
                toast.error(err instanceof Error ? err.message : String(err));
              })
            }
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
  const [open, setOpen] = useState(false);
  const providers = status?.enabled ? status.providers : [];
  const [tab, setTab] = useState<AgentProviderId | null>(providerId);
  const shownId = tab ?? providerId ?? providers[0]?.id ?? null;
  const shown = providers.find((p) => p.id === shownId) ?? null;
  const choice = shown?.ready ? resolveModelChoice(shown.models, modelChoices[shown.id]) : null;
  const selectedModel = shown?.id === providerId ? (model ?? choice?.model) : choice?.model;
  const selectedEffort = shown?.id === providerId ? effort : (choice?.effort ?? null);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setTab(providerId);
      }}
    >
      <PopoverTrigger
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
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[272px] p-1.5" data-agent-model-menu>
        {providers.length > 1 && (
          <div role="tablist" className="mb-1.5 flex gap-0.5 rounded-[6px] bg-muted p-0.5">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === shownId}
                onClick={() => setTab(p.id)}
                className={cn(
                  'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[12px] font-medium text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
                  p.id === shownId && 'bg-background text-foreground shadow-edge',
                )}
              >
                <ProviderLogo provider={p.id} className="size-3.5 shrink-0" />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {shown && !shown.ready ? (
          <div className="flex flex-col items-start gap-2 px-2 py-2.5">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {shown.cliFound
                ? format(t.agent.connectInstallHint, {
                    pkg: shown.sdkPackage,
                    pm: status?.packageManager ?? 'npm',
                  })
                : format(t.agent.cliHint, { name: shown.name })}
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
            >
              {t.agent.connect}
            </Button>
          </div>
        ) : shown ? (
          <div className="flex flex-col gap-px">
            {shown.models.map((m) => {
              const checked = m.id === selectedModel?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setModelChoice(shown.id, {
                      model: m.id,
                      effort: modelChoices[shown.id]?.effort ?? null,
                    })
                  }
                  className={cn(
                    'flex h-7 items-center justify-between gap-2 rounded-[5px] px-2 text-left text-[12.5px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted',
                    checked && 'font-medium',
                  )}
                >
                  <span className="truncate">{modelLabel(m, t)}</span>
                  {checked && <Check className="size-3.5 shrink-0" aria-hidden />}
                </button>
              );
            })}
          </div>
        ) : null}

        {shown?.ready && selectedModel && selectedModel.efforts.length > 0 && (
          <div className="mt-1.5 border-t border-hairline px-1 pt-2 pb-1">
            <div className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
              {t.agent.reasoning}
            </div>
            <div className="flex gap-0.5 rounded-[6px] bg-muted p-0.5">
              {([null, ...selectedModel.efforts] as (AgentEffort | null)[]).map((e) => {
                const checked = e === selectedEffort;
                return (
                  <button
                    key={e ?? 'auto'}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => setModelChoice(shown.id, { model: selectedModel.id, effort: e })}
                    className={cn(
                      'h-6 min-w-0 flex-1 truncate rounded-[4px] px-1 text-[11.5px] text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
                      checked && 'bg-background font-medium text-foreground shadow-edge',
                    )}
                  >
                    {e ? t.agent.efforts[e] : t.agent.effortAuto}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-1.5 flex flex-col gap-px border-t border-hairline pt-1.5">
          {readyProviders(status).length > 0 && (
            <button
              type="button"
              role="switch"
              aria-checked={autoApprove}
              title={t.agent.autoApproveHint}
              onClick={() => setAutoApprove(!autoApprove)}
              className="flex h-7 items-center justify-between gap-2 rounded-[5px] px-2 text-[12.5px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted"
            >
              {t.agent.autoApprove}
              <span
                aria-hidden
                className={cn(
                  'relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150',
                  autoApprove ? 'bg-foreground' : 'bg-foreground/15',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 size-3 rounded-full bg-background shadow-sm transition-transform duration-150',
                    autoApprove && 'translate-x-3',
                  )}
                />
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onManage();
            }}
            className="flex h-7 items-center gap-2 rounded-[5px] px-2 text-[12.5px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:bg-muted"
          >
            <Settings2 className="size-3.5" />
            {t.agent.manageConnections}
          </button>
        </div>
      </PopoverContent>
    </Popover>
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

function BetaBadge() {
  const t = useLocale();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="ml-1 shrink-0 cursor-default rounded-[3px] border border-border px-1 py-px font-medium text-[9px] text-muted-foreground uppercase leading-none tracking-wider outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            {t.agent.beta}
          </button>
        }
      />
      <TooltipContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-64 px-3 py-2.5 text-left text-pretty"
      >
        <p className="font-medium text-[12px]">{t.agent.betaTitle}</p>
        <p className="mt-1 text-[11.5px] text-background/70 leading-relaxed">{t.agent.betaHint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
