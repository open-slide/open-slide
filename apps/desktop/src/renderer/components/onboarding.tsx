import { ArrowLeft, ArrowRight, FolderOpen, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentInfo, AppState } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { splitPath } from '../lib/paths';
import { IDLE_LOGIN, type Login, LoginCodeForm, useAgents } from './agents-section';
import { AgentScene, CodeScene, WorkspaceScene } from './onboarding-scenes';
import { LineLoader, StatusDot } from './primitives';

const STEPS = [
  {
    eyebrow: 'Slides as code',
    title: 'Every slide is a React component.',
    body: 'Decks are folders of plain TSX. Write them by hand or let an agent draft them — every save lands on the slide live.',
    file: 'slides/launch/index.tsx',
    Scene: CodeScene,
  },
  {
    eyebrow: 'Your agent',
    title: 'You direct. Your agent drafts.',
    body: 'Claude Code and Codex ship inside the app. Sign in once and the agent panel in every deck is ready to take notes.',
    file: 'launch — Agent',
    Scene: AgentScene,
  },
  {
    eyebrow: 'Workspace',
    title: 'Give your decks a home.',
    body: 'A workspace is a folder that holds your decks, themes, and assets. Start a fresh one, or open one you already have.',
    file: '~/Documents/my-slides',
    Scene: WorkspaceScene,
  },
] as const;

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
  onChoose,
  onCreate,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  onChoose: () => void;
  onCreate: () => void;
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

  const { eyebrow, title, body, file, Scene } = STEPS[step] ?? STEPS[0];
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
          <div className="my-auto flex w-full max-w-[720px] flex-col items-center">
            <div
              ref={tiltRef}
              className="ob-tilt w-full"
              style={{ maxWidth: 'min(680px, max(240px, calc((100vh - 500px) * 1.62)))' }}
            >
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
                className="ob-in mt-3 max-w-[470px] text-[14px] leading-relaxed text-pretty text-muted-foreground"
                style={{ '--i': 2 } as React.CSSProperties}
              >
                {body}
              </p>
              {step > 0 && (
                <div className="ob-in mt-6 w-full" style={{ '--i': 3 } as React.CSSProperties}>
                  {step === 1 ? (
                    <AgentList />
                  ) : (
                    <WorkspaceChoices
                      state={state}
                      error={error}
                      onChoose={onChoose}
                      onCreate={onCreate}
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
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Welcome tour">
      {STEPS.map((s, i) => (
        <button
          key={s.eyebrow}
          type="button"
          role="tab"
          aria-selected={i === step}
          aria-label={s.eyebrow}
          onClick={() => onSelect(i)}
          className="group flex h-6 items-center outline-none"
        >
          <span
            className={cn(
              'block h-[11px] rounded-[3px] transition-[width,background-color,box-shadow] duration-500 ease-[var(--ease-swift)] group-focus-visible:ring-2 group-focus-visible:ring-ring/50',
              i === step
                ? 'w-[30px] bg-foreground'
                : i < step
                  ? 'w-[19px] bg-foreground/30 group-hover:bg-foreground/45'
                  : 'w-[19px] bg-transparent shadow-[inset_0_0_0_1px_var(--hairline)] group-hover:bg-foreground/[0.06]',
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
  onChoose,
  onCreate,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  onChoose: () => void;
  onCreate: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const current = state.workspace;
  const recent = state.recent.filter((path) => path !== current?.root).slice(0, 3);
  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-3 text-left">
        <ChoiceTile
          primary
          icon={<Plus className="size-4" />}
          title="Create a workspace"
          description="Start fresh, with the agent skills set up."
          onClick={onCreate}
        />
        <ChoiceTile
          icon={<FolderOpen className="size-4" />}
          title="Open a folder…"
          description="Pick up a workspace you already have."
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
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-3 rounded-[12px] border border-border bg-card p-4 text-left shadow-edge outline-none',
        'transition-[translate,box-shadow,background-color] duration-200 ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:shadow-floating active:translate-y-0 active:bg-muted/60',
        'focus-visible:ring-2 focus-visible:ring-ring/40 motion-reduce:hover:translate-y-0',
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
    </button>
  );
}
