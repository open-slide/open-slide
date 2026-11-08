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
import { IDLE_LOGIN, type Login, LoginCodeForm, useAgents } from './agents-section';
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
  title: string;
  body: string;
  file: string;
  Scene: () => React.ReactNode;
  points?: { icon: typeof Sparkles; label: string }[];
};

const STEPS: Step[] = [
  {
    kind: 'feature',
    eyebrow: 'Describe it',
    title: 'Say what you need. Get a whole deck.',
    body: 'Describe your talk in plain words and your agent drafts every slide — layout, copy, and charts — while you watch.',
    file: 'Q4 launch',
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
    title: 'Click anything to change it.',
    body: 'Select text, images, or shapes right on the slide. Drag to move, pull to resize, and pick fonts and colours from the panel.',
    file: 'Q4 launch',
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
    title: 'Leave notes. Your agent applies them.',
    body: 'Pin feedback to any part of a slide, the way you would review a doc. Send them off together and every note gets worked in.',
    file: 'Q4 launch',
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
    title: 'A new look in one click.',
    body: 'Restyle the whole deck at once — colours, fonts, and corners. Shuffle for ideas, save looks you love as themes, and bring in your own images and logos.',
    file: 'Q4 launch',
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
    title: 'Present it. Then share it.',
    body: 'Go full screen with speaker notes, a timer, and the next slide in view. When you are done, export a PDF anyone can open.',
    file: 'Q4 launch — Presenter',
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
    title: 'Your agent is already here.',
    body: 'Claude Code and Codex come built in — nothing else to install. Sign in with the account you already use.',
    file: 'Agents',
    Scene: AgentsScene,
  },
  {
    kind: 'workspace',
    eyebrow: 'Get started',
    title: 'Ready when you are.',
    body: 'Your decks, themes, and images are kept together for you, so there is nothing to set up. Already using open-slide? Open the folder you work in.',
    file: 'My decks',
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
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && el === document.body)) go(step + 1);
      else if (e.key === 'ArrowLeft') go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, step]);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - bounds.left) / bounds.width - 0.5;
    const y = (e.clientY - bounds.top) / bounds.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
  };

  if (!armed) return null;

  const { kind, eyebrow, title, body, file, Scene, points } = STEPS[step] ?? STEPS[0];
  const feature = kind === 'feature';
  const motion = { '--dir': direction } as React.CSSProperties;

  return (
    <div className="relative h-full overflow-hidden" onPointerMove={onPointerMove}>
      <div aria-hidden className="ob-fade pointer-events-none absolute inset-0">
        <div
          className="ob-aurora absolute -top-[38%] left-1/2 aspect-[2/1] w-[110%] -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, oklch(0.7 0.18 38 / 0.2), oklch(0.62 0.2 25 / 0.07) 55%, transparent)',
          }}
        />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-8 pt-4 pb-2">
          <div className="my-auto flex w-full max-w-[960px] flex-col items-center">
            <div
              className="w-full transition-[max-width] duration-700 ease-[var(--ease-swift)]"
              style={{
                maxWidth: feature
                  ? 'min(920px, max(320px, calc((100vh - 410px) * 1.74)))'
                  : 'min(680px, max(240px, calc((100vh - 500px) * 1.62)))',
              }}
            >
              <div ref={tiltRef} className="ob-tilt w-full">
                <div className="ob-stage-in @container overflow-hidden rounded-[14px] border border-border bg-card shadow-overlay">
                  <div className="flex h-[26px] items-center border-b border-hairline px-3">
                    <span className="flex gap-[5px]">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-[7px] rounded-full bg-foreground/[0.13]" />
                      ))}
                    </span>
                    <span
                      key={file}
                      className="ob-fade flex-1 pr-[34px] text-center font-mono text-[10.5px] text-muted-foreground"
                    >
                      {file}
                    </span>
                  </div>
                  <div className="relative aspect-video">
                    <div key={step} className="ob-scene-in absolute inset-0" style={motion}>
                      <Scene />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              key={step}
              className="mt-7 flex w-full max-w-[560px] flex-col items-center text-center"
              style={motion}
            >
              <span className="eyebrow ob-in" style={{ '--i': 0 } as React.CSSProperties}>
                <span className="nums text-brand">{String(step + 1).padStart(2, '0')}</span>
                <span className="mx-2 text-foreground/25">/</span>
                {eyebrow}
              </span>
              <h1
                className="ob-in mt-3 font-heading text-[30px] leading-[1.1] font-semibold tracking-[-0.032em] text-balance"
                style={{ '--i': 1 } as React.CSSProperties}
              >
                {title}
              </h1>
              <p
                className="ob-in mt-3 max-w-[500px] text-[14px] leading-relaxed text-pretty text-muted-foreground"
                style={{ '--i': 2 } as React.CSSProperties}
              >
                {body}
              </p>
              {points && (
                <ul
                  className="ob-in mt-5 flex flex-wrap justify-center gap-2"
                  style={{ '--i': 3 } as React.CSSProperties}
                >
                  {points.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-3 pl-2 text-[12px] font-medium shadow-edge"
                    >
                      <Icon className="size-3.5 text-brand" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {!feature && (
                <div className="ob-in mt-6 w-full" style={{ '--i': 3 } as React.CSSProperties}>
                  {kind === 'agents' ? (
                    <AgentList />
                  ) : (
                    <WorkspaceChoices
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
          </div>
        </div>

        <footer
          className="ob-in grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-6"
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <div>
            {step < LAST ? (
              <Button variant="ghost" size="sm" onClick={() => go(LAST)}>
                Skip
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => desktop.onboarding.finish()}>
                Not now
              </Button>
            )}
          </div>
          <Progress step={step} onSelect={go} />
          <div className="flex justify-end gap-1.5">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => go(step - 1)}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
            )}
            {step < LAST && (
              <Button size="sm" onClick={() => go(step + 1)}>
                Continue
                <ArrowRight aria-hidden />
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Progress({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <div className="flex items-center" role="tablist" aria-label="Welcome tour">
      {STEPS.map((s, i) => (
        <button
          key={s.eyebrow}
          type="button"
          role="tab"
          aria-selected={i === step}
          aria-label={s.eyebrow}
          onClick={() => onSelect(i)}
          className="group flex h-6 items-center rounded-full px-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span
            className={cn(
              'block h-1.5 rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-swift)]',
              i === step
                ? 'w-5 bg-foreground'
                : 'w-1.5 bg-foreground/20 group-hover:bg-foreground/40',
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
    <div className="mx-auto w-full max-w-[440px]">
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
  const available = agent.cliPath !== null;
  const status = !available
    ? { tone: 'warn' as const, label: 'Unavailable in this build' }
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
      {login.running && (
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
  const current = state.workspace;
  const recent = state.recent.filter((path) => path !== current?.root).slice(0, 3);
  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-3 text-left">
        <ChoiceTile
          primary
          icon={<Sparkles className="size-4" />}
          title="Start creating"
          description={starting ? 'Getting things ready…' : 'Jump straight in. Nothing to set up.'}
          busy={starting}
          disabled={starting}
          onClick={onStart}
        />
        <ChoiceTile
          icon={<FolderOpen className="size-4" />}
          title="Open a folder…"
          description="Pick up an open-slide folder you already have."
          disabled={starting}
          onClick={onChoose}
        />
      </div>
      {error && (
        <p className="mt-3 w-full rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-left text-[12.5px] leading-relaxed text-destructive">
          {error}
        </p>
      )}
      {current && (
        <Button
          variant="link"
          size="sm"
          className="mt-3"
          onClick={() => desktop.onboarding.finish()}
        >
          Continue in {current.name}
          <ArrowRight aria-hidden />
        </Button>
      )}
      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <span className="eyebrow mr-1">Recent</span>
          {recent.map((path) => (
            <button
              key={path}
              type="button"
              title={path}
              disabled={starting}
              onClick={() => onOpenRecent(path)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[12px] font-medium shadow-edge outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {splitPath(path).name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceTile({
  icon,
  title,
  description,
  primary = false,
  busy = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={cn(
        'group relative flex flex-col items-start gap-3 overflow-hidden rounded-[12px] border border-border bg-card p-4 text-left shadow-edge outline-none',
        'transition-[translate,box-shadow,background-color,opacity] duration-200 ease-[var(--ease-swift)] enabled:hover:-translate-y-0.5 enabled:hover:shadow-floating enabled:active:translate-y-0 enabled:active:bg-muted/60',
        'focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:hover:translate-y-0',
        disabled && !busy && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-[8px] transition-transform duration-300 ease-[var(--ease-swift)] group-hover:scale-105',
          primary
            ? 'bg-brand text-brand-foreground shadow-[0_4px_12px_-4px_var(--brand)]'
            : 'bg-muted text-foreground/80',
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block font-heading text-[13.5px] font-semibold tracking-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      {busy && <LineLoader className="absolute inset-x-0 bottom-0 w-full bg-transparent" />}
    </button>
  );
}
