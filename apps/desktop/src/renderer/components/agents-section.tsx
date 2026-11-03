import { RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AgentId, AgentInfo } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { tildify } from '../lib/paths';
import { LineLoader, LogView, SectionCard, StatusDot } from './primitives';

type Login = { output: string; url: string | null; running: boolean; error: string | null };

const IDLE_LOGIN: Login = { output: '', url: null, running: false, error: null };

export function AgentsSection() {
  const [agents, setAgents] = useState<AgentInfo[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [logins, setLogins] = useState<Partial<Record<AgentId, Login>>>({});

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setAgents(await desktop.agents.list());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(
    () =>
      desktop.agents.onLogin((event) => {
        setLogins((prev) => {
          const current = prev[event.id] ?? { ...IDLE_LOGIN, running: true };
          if (event.type === 'output') {
            return { ...prev, [event.id]: { ...current, output: current.output + event.chunk } };
          }
          if (event.type === 'url') return { ...prev, [event.id]: { ...current, url: event.url } };
          return { ...prev, [event.id]: { ...current, running: false } };
        });
        if (event.type === 'exit') void refresh();
      }),
    [refresh],
  );

  const signIn = async (id: AgentId) => {
    setLogins((prev) => ({ ...prev, [id]: { ...IDLE_LOGIN, running: true } }));
    const result = await desktop.agents.login(id);
    if (!result.ok) {
      setLogins((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? IDLE_LOGIN), running: false, error: result.error },
      }));
    }
  };

  const signOut = async (id: AgentId) => {
    await desktop.agents.logout(id);
    await refresh();
  };

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        The agent panel inside each deck drives Claude Code or Codex. Both SDKs ship with the app,
        so a workspace connects without installing anything — just sign in once.
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
            onDismiss={() => setLogins((prev) => ({ ...prev, [agent.id]: IDLE_LOGIN }))}
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
  const [code, setCode] = useState('');
  const available = agent.cliPath !== null;
  const status = !available
    ? { tone: 'warn' as const, label: 'Unavailable' }
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
                agent.cliSource === 'path' ? tildify(agent.cliPath) : 'bundled'
              }`
            : 'not found'}
        </dd>
      </dl>

      {(login.running || login.output || login.error) && (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-hairline pt-4">
          {login.running && (
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
          <LogView text={login.output} className="max-h-40" />
          {login.running ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!code.trim()) return;
                desktop.agents.sendLoginInput(agent.id, code.trim());
                setCode('');
              }}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste a code here if the browser shows one"
                spellCheck={false}
                className="font-mono text-[12px]"
              />
              <Button type="submit" size="sm" variant="outline" disabled={!code.trim()}>
                Submit
              </Button>
            </form>
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
