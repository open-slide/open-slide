import {
  ArrowLeft,
  ArrowRight,
  FileDown,
  FolderOpen,
  ImagePlus,
  ListChecks,
  MessageSquareText,
  Move,
  Palette,
  PenLine,
  Presentation,
  Sparkles,
  SwatchBook,
  Timer,
  Type,
  WandSparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentInfo, AppState } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { splitPath } from '../lib/paths';
import { DownloadStatus, IDLE_LOGIN, type Login, LoginCodeForm, useAgents } from './agents-section';
import {
  AgentsScene,
  CommentScene,
  CreateScene,
  DesignScene,
  EditScene,
  PresentScene,
  WorkspaceScene,
} from './onboarding-scenes';
import { LineLoader, StatusDot } from './primitives';

type Step = {
  kind: 'feature' | 'agents' | 'workspace';
  eyebrow: string;
  title: [string, string];
  body: string;
  Scene: () => React.ReactNode;
  points?: { icon: typeof Sparkles; label: string }[];
};

const STEPS: Step[] = [
  {
    kind: 'feature',
    eyebrow: 'Describe it',
    title: ['Say what you need.', 'Get a whole deck.'],
    body: 'Describe your talk in plain words and your agent drafts every slide — layout, copy, and charts — while you watch.',
    Scene: CreateScene,
    points: [
      { icon: Sparkles, label: 'A full deck from one sentence' },
      { icon: WandSparkles, label: 'Revise by just asking' },
      { icon: PenLine, label: 'No code, no templates' },
    ],
  },
  {
    kind: 'feature',
    eyebrow: 'Edit directly',
    title: ['Click anything', 'to change it.'],
    body: 'Select text, images, or shapes right on the slide. Drag to move, pull to resize, and pick fonts and colours from the panel.',
    Scene: EditScene,
    points: [
      { icon: Move, label: 'Move and resize' },
      { icon: Type, label: 'Fonts and colours' },
      { icon: PenLine, label: 'Edit text in place' },
    ],
  },
  {
    kind: 'feature',
    eyebrow: 'Comment',
    title: ['Leave notes.', 'Your agent applies them.'],
    body: 'Pin feedback to any part of a slide, the way you would review a doc. Send them off together and every note gets worked in.',
    Scene: CommentScene,
    points: [
      { icon: MessageSquareText, label: 'Pin to any element' },
      { icon: ListChecks, label: 'Batch your feedback' },
      { icon: Sparkles, label: 'Applied for you' },
    ],
  },
  {
    kind: 'feature',
    eyebrow: 'Design',
    title: ['A new look', 'in one click.'],
    body: 'Restyle the whole deck at once — colours, fonts, and corners. Shuffle for ideas, save looks you love as themes, and bring in your own images and logos.',
    Scene: DesignScene,
    points: [
      { icon: Palette, label: 'Restyle every slide' },
      { icon: SwatchBook, label: 'Reusable themes' },
      { icon: ImagePlus, label: 'Images, video, and logos' },
    ],
  },
  {
    kind: 'feature',
    eyebrow: 'Present',
    title: ['Present it.', 'Then share it.'],
    body: 'Go full screen with speaker notes, a timer, and the next slide in view. When you are done, export a PDF anyone can open.',
    Scene: PresentScene,
    points: [
      { icon: Presentation, label: 'Presenter view' },
      { icon: Timer, label: 'Notes and timer' },
      { icon: FileDown, label: 'Export to PDF' },
    ],
  },
  {
    kind: 'agents',
    eyebrow: 'Your agent',
    title: ['Your agent,', 'one sign-in away.'],
    body: 'Sign in to Claude Code or Codex with the account you already use. If it is not on this computer yet, the app fetches it for you.',
    Scene: AgentsScene,
  },
  {
    kind: 'workspace',
    eyebrow: 'Get started',
    title: ['Ready', 'when you are.'],
    body: 'Your decks, themes, and images are kept together for you, so there is nothing to set up. Already using open-slide? Open the folder you work in.',
    Scene: WorkspaceScene,
  },
];

const LAST = STEPS.length - 1;

function subscribeVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

// The window may sit hidden or covered by the intro while this mounts; the
// entrance waits until someone can actually see it, then stays put.
function useArmed(ready: boolean): boolean {
  const visible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
  );
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (ready && visible) setArmed(true);
  }, [ready, visible]);
  return armed;
}

export function Onboarding({
  state,
  error,
  starting,
  onChoose,
  onStart,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  starting: boolean;
  onChoose: () => void;
  onStart: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const armed = useArmed(!state.intro);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const tiltRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(LAST, next));
      if (target === step) return;
      setDirection(target > step ? 1 : -1);
      setStep(target);
      desktop.haptic('levelChange');
    },
    [step],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, [role="dialog"]')) return;
      if (e.key === 'Enter' && el === document.body && step === LAST) {
        if (!starting) onStart();
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && el === document.body)) {
        go(step + 1);
      } else if (e.key === 'ArrowLeft') go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, step, starting, onStart]);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - bounds.left) / bounds.width - 0.5;
    const y = (e.clientY - bounds.top) / bounds.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
  };

  if (!armed) return null;

  const { kind, eyebrow, title, body, Scene, points } = STEPS[step] ?? STEPS[0];
  const motion = { '--dir': direction } as React.CSSProperties;
  const isMac = state.platform === 'darwin';

  return (
    <div className="relative h-full overflow-hidden" onPointerMove={onPointerMove}>
      <div aria-hidden className="ob-fade ob-grid pointer-events-none absolute inset-0" />

      <div className="relative flex h-full flex-col">
        <div className="flex min-h-0 flex-1 overflow-y-auto px-10 py-6">
          <div className="m-auto grid w-full max-w-[1320px] grid-cols-[clamp(280px,26vw,360px)_minmax(0,1fr)] items-center gap-[clamp(32px,4.5vw,72px)]">
            <div key={step} className="flex flex-col py-2" style={motion}>
              <p
                className="ob-in flex items-center gap-2.5"
                style={{ '--i': 0 } as React.CSSProperties}
              >
                <span className="nums font-mono text-[11px] font-medium text-brand">
                  {String(step + 1).padStart(2, '0')}
                </span>
                <span className="h-px w-5 bg-foreground/15" />
                <span className="eyebrow">{eyebrow}</span>
              </p>
              <h1
                className="ob-in mt-4 font-heading text-[clamp(26px,2.5vw,36px)] leading-[1.06] font-semibold tracking-[-0.038em] text-balance"
                style={{ '--i': 1 } as React.CSSProperties}
              >
                <span className="block">{title[0]}</span>
                <span className="block text-foreground/35">{title[1]}</span>
              </h1>
              <p
                className="ob-in mt-4 text-[clamp(13px,1vw,14.5px)] leading-relaxed text-pretty text-muted-foreground"
                style={{ '--i': 2 } as React.CSSProperties}
              >
                {body}
              </p>
              {points && (
                <ul className="mt-6 flex flex-col">
                  {points.map(({ icon: Icon, label }, i) => (
                    <li
                      key={label}
                      className="ob-in flex items-center gap-3 border-t border-hairline py-2 text-[13px] font-medium last:border-b"
                      style={{ '--i': 3 + i * 0.6 } as React.CSSProperties}
                    >
                      <Icon className="size-[15px] shrink-0 text-brand" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {kind !== 'feature' && (
                <div className="ob-in mt-7" style={{ '--i': 3 } as React.CSSProperties}>
                  {kind === 'agents' ? (
                    <AgentList />
                  ) : (
                    <WorkspaceChoices
                      isMac={isMac}
                      state={state}
                      error={error}
                      starting={starting}
                      onChoose={onChoose}
                      onStart={onStart}
                      onOpenRecent={onOpenRecent}
                    />
                  )}
                </div>
              )}
            </div>

            <div
              className="relative isolate justify-self-center"
              style={{ width: 'min(100%, calc((100vh - 200px) * 16 / 9))' }}
            >
              <div aria-hidden className="ob-glow ob-fade pointer-events-none absolute -z-10" />
              <div ref={tiltRef} className="ob-tilt">
                <div className="ob-stage-in ob-bezel">
                  <div className="ob-screen @container relative aspect-video">
                    <div key={step} className="ob-scene-in absolute inset-0" style={motion}>
                      <Scene />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer
          className="ob-in grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-hairline px-5"
          style={{ '--i': 5 } as React.CSSProperties}
        >
          <div>
            {step < LAST ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => go(LAST)}
              >
                Skip tour
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => desktop.onboarding.finish()}
              >
                Not now
              </Button>
            )}
          </div>
          <Progress step={step} onSelect={go} />
          <div className="flex justify-end gap-1">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => go(step - 1)}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
            )}
            {step < LAST && (
              <Button size="sm" className="pr-1.5" onClick={() => go(step + 1)}>
                Continue
                <Kbd className="bg-primary-foreground/15 text-primary-foreground/80">↵</Kbd>
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] px-1 font-sans text-[11px] leading-none font-medium',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function Progress({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" role="tablist" aria-label="Welcome tour">
      {STEPS.map((s, i) => (
        <button
          key={s.eyebrow}
          type="button"
          role="tab"
          aria-selected={i === step}
          aria-label={s.eyebrow}
          title={s.eyebrow}
          onClick={() => onSelect(i)}
          className="group flex h-6 items-center rounded-full px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span
            className={cn(
              'block h-[3px] rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-swift)]',
              i === step
                ? 'w-7 bg-foreground'
                : i < step
                  ? 'w-3.5 bg-foreground/40 group-hover:bg-foreground/60'
                  : 'w-3.5 bg-foreground/12 group-hover:bg-foreground/30',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function AgentList() {
  const { agents, logins, signIn, signOut, dismiss } = useAgents();
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[12px] border border-border bg-card text-left shadow-edge">
        {agents === null ? (
          <div className="flex h-[118px] items-center justify-center">
            <LineLoader className="w-24" />
          </div>
        ) : (
          agents.map((agent, i) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              login={logins[agent.id] ?? IDLE_LOGIN}
              className={cn(i > 0 && 'border-t border-hairline')}
              onSignIn={() => void signIn(agent.id)}
              onSignOut={() => void signOut(agent.id)}
              onDismiss={() => dismiss(agent.id)}
            />
          ))
        )}
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        Not ready? You can sign in any time from Settings.
      </p>
    </div>
  );
}

function AgentRow({
  agent,
  login,
  className,
  onSignIn,
  onSignOut,
  onDismiss,
}: {
  agent: AgentInfo;
  login: Login;
  className?: string;
  onSignIn: () => void;
  onSignOut: () => void;
  onDismiss: () => void;
}) {
  const available = agent.cliPath !== null || agent.cliInstallable;
  const status = !available
    ? { tone: 'warn' as const, label: 'Unavailable on this platform' }
    : agent.cliPath === null
      ? { tone: 'off' as const, label: 'Downloads when you sign in' }
      : agent.signedIn
        ? { tone: 'ok' as const, label: agent.account ?? 'Signed in' }
        : { tone: 'off' as const, label: 'Not signed in' };

  return (
    <div className={cn('px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-muted transition-shadow duration-500',
            agent.signedIn && 'shadow-[0_0_0_1.5px_var(--color-emerald-500)]',
          )}
        >
          <ProviderLogo provider={agent.id} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[13.5px] font-semibold tracking-tight">{agent.name}</p>
          <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <StatusDot tone={status.tone} />
            <span className="selectable truncate">{status.label}</span>
          </p>
        </div>
        {available &&
          (login.running ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => desktop.agents.cancelLogin(agent.id)}
            >
              Cancel
            </Button>
          ) : agent.signedIn ? (
            <Button size="sm" variant="ghost" onClick={onSignOut}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onSignIn}>
              Sign in
            </Button>
          ))}
      </div>
      {login.download && (
        <div className="ob-pop mt-3 pl-11">
          <DownloadStatus name={agent.name} download={login.download} />
        </div>
      )}
      {login.running && !login.download && (
        <div className="ob-pop mt-3 flex flex-col gap-2 pl-11">
          <p className="text-[12px] leading-relaxed">
            Finish signing in from your browser.
            {login.url && (
              <>
                {' '}
                <button
                  type="button"
                  className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                  onClick={() => login.url && desktop.openExternal(login.url)}
                >
                  Open it again
                </button>
              </>
            )}
          </p>
          <LoginCodeForm id={agent.id} />
        </div>
      )}
      {!login.running && login.error && (
        <p className="mt-2 pl-11 text-[12px] text-destructive">
          {login.error}{' '}
          <button type="button" className="underline underline-offset-2" onClick={onDismiss}>
            Dismiss
          </button>
        </p>
      )}
    </div>
  );
}

function WorkspaceChoices({
  isMac,
  state,
  error,
  starting,
  onChoose,
  onStart,
  onOpenRecent,
}: {
  isMac: boolean;
  state: AppState;
  error: string | null;
  starting: boolean;
  onChoose: () => void;
  onStart: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const current = state.workspace;
  const recent = state.recent.filter((path) => path !== current?.root).slice(0, 3);
  return (
    <div className="flex w-full flex-col items-start">
      <div className="w-full overflow-hidden rounded-[12px] border border-border bg-card shadow-edge">
        <ChoiceRow
          primary
          icon={<Sparkles className="size-4" />}
          title="Start creating"
          description={starting ? 'Getting things ready…' : 'Jump straight in. Nothing to set up.'}
          shortcut="↵"
          busy={starting}
          disabled={starting}
          onClick={onStart}
        />
        <ChoiceRow
          className="border-t border-hairline"
          icon={<FolderOpen className="size-4" />}
          title="Open a folder…"
          description="Pick up an open-slide folder you already have."
          shortcut={isMac ? '⌘O' : 'Ctrl O'}
          disabled={starting}
          onClick={onChoose}
        />
      </div>
      {error && (
        <p className="mt-3 w-full rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
          {error}
        </p>
      )}
      {current && (
        <Button
          variant="link"
          size="sm"
          className="mt-3 px-0"
          onClick={() => desktop.onboarding.finish()}
        >
          Continue in {current.name}
          <ArrowRight aria-hidden />
        </Button>
      )}
      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="eyebrow">Recent</span>
          {recent.map((path) => (
            <button
              key={path}
              type="button"
              title={path}
              disabled={starting}
              onClick={() => onOpenRecent(path)}
              className="rounded-[4px] text-[12.5px] font-medium text-foreground/70 underline decoration-foreground/15 underline-offset-[3px] outline-none transition-colors hover:text-foreground hover:decoration-foreground/50 focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {splitPath(path).name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceRow({
  icon,
  title,
  description,
  shortcut,
  primary = false,
  busy = false,
  disabled = false,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  shortcut: string;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={cn(
        'group relative flex w-full items-center gap-3 px-3.5 py-3 text-left outline-none',
        'transition-[background-color,opacity] duration-150 enabled:hover:bg-foreground/[0.03] enabled:active:bg-foreground/[0.05]',
        'focus-visible:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset',
        disabled && !busy && 'opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-300 ease-[var(--ease-swift)] group-enabled:group-hover:scale-105',
          primary
            ? 'bg-brand text-brand-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_4px_12px_-4px_var(--brand)]'
            : 'bg-muted text-foreground/80 shadow-edge',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[13.5px] font-semibold tracking-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
      <Kbd className="shrink-0 border border-border bg-muted/60 text-muted-foreground transition-colors group-enabled:group-hover:text-foreground">
        {shortcut}
      </Kbd>
      {busy && <LineLoader className="absolute inset-x-0 bottom-0 w-full bg-transparent" />}
    </button>
  );
}
