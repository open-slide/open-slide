import { RotateCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AGENT_IDS, type AgentId, type AgentInfo, type LoginState } from '../../shared/types';
import { type AgentStatus, agentStatus, agentStatusTone } from '../lib/agent-status';
import { desktop, settle, useLogins } from '../lib/desktop';
import { tildify } from '../lib/paths';
import {
  LineLoader,
  LoadingLabel,
  LogView,
  ProgressLine,
  SectionCard,
  StatusDot,
} from './primitives';

export type Login = Pick<LoginState, 'output' | 'url' | 'error' | 'download'> & {
  running: boolean;
};

const IDLE_LOGIN: Login = { output: '', url: null, error: null, download: null, running: false };

function toLogin(state: LoginState | undefined): Login {
  if (!state) return IDLE_LOGIN;
  return { ...state, running: state.phase === 'downloading' || state.phase === 'signing-in' };
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentInfo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signOutErrors, setSignOutErrors] = useState<Partial<Record<AgentId, string>>>({});
  const states = useLogins();
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++latest.current;
    setRefreshing(true);
    const next = await desktop.agents.list().catch(() => null);
    if (request !== latest.current) return;
    setAgents((prev) => next ?? prev ?? []);
    setRefreshing(false);
  }, []);

  const progress = AGENT_IDS.map((id) => {
    const state = states[id];
    return state ? `${state.operation}:${state.phase}` : '';
  }).join(' ');
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on every sign-in step
  useEffect(() => {
    void refresh();
  }, [refresh, progress]);

  const setSignOutError = (id: AgentId, error: string | undefined) =>
    setSignOutErrors((prev) => ({ ...prev, [id]: error }));

  return {
    agents,
    refreshing,
    refresh,
    login: (id: AgentId) => toLogin(states[id]),
    signOutError: (id: AgentId) => signOutErrors[id] ?? null,
    signIn: (id: AgentId) => {
      setSignOutError(id, undefined);
      void desktop.agents.login(id).catch(() => {});
    },
    signOut: async (id: AgentId) => {
      setSignOutError(id, undefined);
      const result = await settle(desktop.agents.logout(id));
      if (!result.ok) setSignOutError(id, result.error);
      await refresh();
    },
    dismiss: (id: AgentId) => desktop.agents.dismissLogin(id),
  };
}

export function AgentsSection() {
  const { agents, refreshing, refresh, login, signOutError, signIn, signOut, dismiss } =
    useAgents();

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        The agent panel inside each deck drives Claude Code or Codex. If the agent isn't installed
        on this computer yet, signing in downloads it once — there is nothing else to set up.
      </p>
      {agents === null ? (
        <SectionCard>
          <LoadingLabel>Checking agents</LoadingLabel>
        </SectionCard>
      ) : (
        agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            login={login(agent.id)}
            signOutError={signOutError(agent.id)}
            onSignIn={() => signIn(agent.id)}
            onSignOut={() => signOut(agent.id)}
            onDismiss={() => dismiss(agent.id)}
          />
        ))
      )}
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={refreshing}
        onClick={() => void refresh()}
      >
        <RotateCw
          className={cn('size-3.5', refreshing && 'animate-spin motion-reduce:animate-none')}
          aria-hidden
        />
        Check again
      </Button>
    </>
  );
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  unavailable: 'Unavailable',
  'not-installed': 'Not installed',
  'signed-in': 'Signed in',
  'signed-out': 'Not signed in',
  unknown: 'Status unknown',
};

function AgentCard({
  agent,
  login,
  signOutError,
  onSignIn,
  onSignOut,
  onDismiss,
}: {
  agent: AgentInfo;
  login: Login;
  signOutError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDismiss: () => void;
}) {
  const status = agentStatus(agent);
  const available = status !== 'unavailable';

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-heading text-[14px] font-semibold tracking-tight">
            <ProviderLogo provider={agent.id} className="size-4 shrink-0" />
            {agent.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <StatusDot tone={agentStatusTone(status)} />
            {STATUS_LABELS[status]}
            {status === 'signed-in' && agent.account && (
              <span className="selectable truncate text-foreground/80">· {agent.account}</span>
            )}
          </p>
        </div>
        {available && (
          <div className="shrink-0">
            <LoginButton
              agent={agent}
              running={login.running}
              signInVariant="default"
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
          </div>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12px]">
        <dt className="text-muted-foreground">SDK</dt>
        <dd className="font-mono text-[11.5px]">
          {agent.sdkVersion ? `${agent.sdkVersion} · bundled` : 'missing from this build'}
        </dd>
        <dt className="text-muted-foreground">CLI</dt>
        <dd className="min-w-0 truncate font-mono text-[11.5px]" title={agent.cliPath ?? undefined}>
          {agent.cliPath
            ? `${agent.cliVersion ?? 'unknown version'} · ${
                agent.cliSource === 'path' ? tildify(agent.cliPath) : 'downloaded'
              }`
            : agent.cliInstallable
              ? 'downloads when you sign in'
              : 'not found'}
        </dd>
      </dl>

      {signOutError && (
        <p className="selectable mt-3 text-[12.5px] text-destructive">
          Couldn’t sign out: {signOutError}
        </p>
      )}

      {(login.running || login.output || login.error) && (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-hairline pt-4">
          {login.download && <DownloadStatus name={agent.name} download={login.download} />}
          {login.running && !login.download && (
            <BrowserHint
              url={login.url}
              linkLabel="Open the sign-in page again"
              className="text-[12.5px]"
            />
          )}
          {login.error && <p className="text-[12.5px] text-destructive">{login.error}</p>}
          {!login.download && <LogView text={login.output} className="max-h-40" />}
          {login.download ? null : login.running ? (
            <LoginCodeForm id={agent.id} />
          ) : (
            <Button size="xs" variant="ghost" className="self-start" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function LoginButton({
  agent,
  running,
  signInVariant,
  onSignIn,
  onSignOut,
}: {
  agent: AgentInfo;
  running: boolean;
  signInVariant: 'default' | 'outline';
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (running) {
    return (
      <Button size="sm" variant="outline" onClick={() => desktop.agents.cancelLogin(agent.id)}>
        Cancel
      </Button>
    );
  }
  return agent.signedIn ? (
    <Button size="sm" variant="ghost" onClick={onSignOut}>
      Sign out
    </Button>
  ) : (
    <Button size="sm" variant={signInVariant} onClick={onSignIn}>
      Sign in
    </Button>
  );
}

export function BrowserHint({
  url,
  linkLabel,
  className,
}: {
  url: string | null;
  linkLabel: string;
  className: string;
}) {
  return (
    <p className={cn('leading-relaxed', className)}>
      Finish signing in from your browser.
      {url && (
        <>
          {' '}
          <button
            type="button"
            className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
            onClick={() => desktop.openExternal(url)}
          >
            {linkLabel}
          </button>
        </>
      )}
    </p>
  );
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}

export function DownloadStatus({
  name,
  download,
}: {
  name: string;
  download: NonNullable<Login['download']>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span>Downloading {name}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {megabytes(download.received)}
          {download.total ? ` / ${megabytes(download.total)}` : ''}
        </span>
      </p>
      {download.total ? (
        <ProgressLine
          value={download.received / download.total}
          label={`Downloading ${name}`}
          className="w-full"
        />
      ) : (
        <LineLoader className="w-full" />
      )}
    </div>
  );
}

export function LoginCodeForm({ id }: { id: AgentId }) {
  const [code, setCode] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) return;
        desktop.agents.sendLoginInput(id, code.trim());
        setCode('');
      }}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Sign-in code"
        placeholder="Paste a code here if the browser shows one"
        spellCheck={false}
        className="font-mono text-[12px]"
      />
      <Button type="submit" size="sm" variant="outline" disabled={!code.trim()}>
        Submit
      </Button>
    </form>
  );
}
