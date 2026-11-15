import { RotateCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AGENT_IDS, type AgentId, type AgentInfo, type LoginState } from '../../shared/types';
import { desktop, useLogins } from '../lib/desktop';
import { tildify } from '../lib/paths';
import { LineLoader, LogView, ProgressLine, SectionCard, StatusDot } from './primitives';

export type Login = {
  output: string;
  url: string | null;
  running: boolean;
  error: string | null;
  download: { received: number; total: number | null } | null;
};

export const IDLE_LOGIN: Login = {
  output: '',
  url: null,
  running: false,
  error: null,
  download: null,
};

function toLogin(state: LoginState | undefined): Login {
  if (!state) return IDLE_LOGIN;
  const { output, url, error, download, phase } = state;
  return {
    output,
    url,
    error,
    download,
    running: phase === 'downloading' || phase === 'signing-in',
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentInfo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const states = useLogins();

  const latest = useRef(0);

  // Sign-in fires several refreshes in a row, and an earlier one can answer last.
  const refresh = useCallback(async () => {
    const request = ++latest.current;
    setRefreshing(true);
    const next = await desktop.agents.list().catch(() => null);
    if (request !== latest.current) return;
    setAgents((prev) => next ?? prev ?? []);
    setRefreshing(false);
  }, []);

  // What an agent offers changes when its CLI lands and when a sign-in ends,
  // whichever window that happened in.
  const progress = AGENT_IDS.map((id) => {
    const state = states[id];
    return state ? `${state.operation}:${state.phase}` : '';
  }).join(' ');
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on every sign-in step
  useEffect(() => {
    void refresh();
  }, [refresh, progress]);

  const logins: Partial<Record<AgentId, Login>> = {};
  for (const id of AGENT_IDS) logins[id] = toLogin(states[id]);

  const signIn = (id: AgentId) => void desktop.agents.login(id).catch(() => {});

  const signOut = async (id: AgentId) => {
    await desktop.agents.logout(id);
    await refresh();
  };

  const dismiss = (id: AgentId) => desktop.agents.dismissLogin(id);

  return { agents, refreshing, logins, refresh, signIn, signOut, dismiss };
}

export function AgentsSection() {
  const { agents, refreshing, logins, refresh, signIn, signOut, dismiss } = useAgents();

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        The agent panel inside each deck drives Claude Code or Codex. If the agent isn't installed
        on this computer yet, signing in downloads it once — there is nothing else to set up.
      </p>
      {agents === null ? (
        <SectionCard>
          <div className="flex items-center gap-3">
            <LineLoader className="w-24" />
            <span className="eyebrow">Checking agents</span>
          </div>
        </SectionCard>
      ) : (
        agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            login={logins[agent.id] ?? IDLE_LOGIN}
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

function AgentCard({
  agent,
  login,
  onSignIn,
  onSignOut,
  onDismiss,
}: {
  agent: AgentInfo;
  login: Login;
  onSignIn: () => void;
  onSignOut: () => void;
  onDismiss: () => void;
}) {
  const available = agent.cliPath !== null || agent.cliInstallable;
  const status = !available
    ? { tone: 'warn' as const, label: 'Unavailable' }
    : agent.cliPath === null
      ? { tone: 'off' as const, label: 'Not installed' }
      : agent.signedIn
        ? { tone: 'ok' as const, label: 'Signed in' }
        : agent.signedIn === false
          ? { tone: 'off' as const, label: 'Not signed in' }
          : { tone: 'off' as const, label: 'Status unknown' };

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-heading text-[14px] font-semibold tracking-tight">
            <ProviderLogo provider={agent.id} className="size-4 shrink-0" />
            {agent.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <StatusDot tone={status.tone} />
            {status.label}
            {agent.signedIn && agent.account && (
              <span className="selectable truncate text-foreground/80">· {agent.account}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {available &&
            !login.running &&
            (agent.signedIn ? (
              <Button size="sm" variant="ghost" onClick={onSignOut}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" onClick={onSignIn}>
                Sign in
              </Button>
            ))}
          {login.running && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => desktop.agents.cancelLogin(agent.id)}
            >
              Cancel
            </Button>
          )}
        </div>
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

      {(login.running || login.output || login.error) && (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-hairline pt-4">
          {login.download && <DownloadStatus name={agent.name} download={login.download} />}
          {login.running && !login.download && (
            <p className="text-[12.5px] leading-relaxed">
              Finish signing in from your browser.
              {login.url && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                    onClick={() => login.url && desktop.openExternal(login.url)}
                  >
                    Open the sign-in page again
                  </button>
                </>
              )}
            </p>
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
