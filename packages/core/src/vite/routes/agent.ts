import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { createProviders } from '../../agent/providers/index.ts';
import { type AgentRunner, createAgentRunner, type RespondPayload } from '../../agent/runner.ts';
import { agentStatus, installSdk } from '../../agent/status.ts';
import { createSessionStore } from '../../agent/store.ts';
import {
  AGENT_WS_EVENT,
  type AgentProviderId,
  type AgentTurnContext,
  type AgentWsEvent,
} from '../../agent/types.ts';
import { SLIDE_ID_RE } from '../../editing/slide-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody } from './context.ts';
import { detectPackageManager } from './update.ts';

// GET    /__agent/status                      → AgentStatus
// POST   /__agent/install                     { provider } → { ok }
// GET    /__agent/sessions                    → { sessions: AgentSessionSummary[] }
// POST   /__agent/sessions                    { provider, slideId? } → AgentSession
// GET    /__agent/sessions/:id                → AgentSession
// DELETE /__agent/sessions/:id                → { ok }
// POST   /__agent/sessions/:id/messages       { text, context?, autoApprove? } → { ok }
// POST   /__agent/sessions/:id/stop           → { ok }
// POST   /__agent/sessions/:id/respond        { itemId, answers? | allow? | cancel? } → { ok }
//
// Turn progress streams to the browser over Vite's HMR socket as
// `open-slide:agent` custom events; the REST surface only mutates.

const PROVIDER_IDS: AgentProviderId[] = ['claude', 'codex'];

function isProviderId(value: unknown): value is AgentProviderId {
  return typeof value === 'string' && (PROVIDER_IDS as string[]).includes(value);
}

function parseContext(raw: unknown): AgentTurnContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const ctx: AgentTurnContext = {};
  if (typeof r.slideId === 'string' && SLIDE_ID_RE.test(r.slideId)) ctx.slideId = r.slideId;
  if (typeof r.slideTitle === 'string') ctx.slideTitle = r.slideTitle.slice(0, 120);
  if (typeof r.pageNumber === 'number' && Number.isFinite(r.pageNumber)) {
    ctx.pageNumber = Math.max(1, Math.floor(r.pageNumber));
  }
  if (typeof r.totalPages === 'number' && Number.isFinite(r.totalPages)) {
    ctx.totalPages = Math.max(1, Math.floor(r.totalPages));
  }
  if (typeof r.pendingComments === 'number' && Number.isFinite(r.pendingComments)) {
    ctx.pendingComments = Math.max(0, Math.floor(r.pendingComments));
  }
  const sel = r.selection;
  if (sel && typeof sel === 'object') {
    const s = sel as Record<string, unknown>;
    if (typeof s.line === 'number' && typeof s.column === 'number') {
      ctx.selection = {
        line: Math.max(1, Math.floor(s.line)),
        column: Math.max(0, Math.floor(s.column)),
        tagName: typeof s.tagName === 'string' ? s.tagName.slice(0, 32) : 'element',
        text: typeof s.text === 'string' ? s.text.slice(0, 120) : '',
      };
    }
  }
  return ctx;
}

function parseRespond(raw: unknown): RespondPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.cancel === true) return { cancel: true };
  if (typeof r.allow === 'boolean') return { allow: r.allow };
  if (r.answers && typeof r.answers === 'object') {
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) {
      if (typeof v === 'string') answers[k] = v;
    }
    return { answers };
  }
  return null;
}

export function registerAgentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  const providers = createProviders();
  const store = createSessionStore({
    file: path.join(ctx.userCwd, 'node_modules', '.open-slide', 'agent-sessions.json'),
  });
  const runner: AgentRunner = createAgentRunner({ userCwd: ctx.userCwd, store, providers });

  store.subscribe((event: AgentWsEvent) => {
    server.ws.send({ type: 'custom', event: AGENT_WS_EVENT, data: event });
  });
  server.httpServer?.on('close', () => {
    runner.stopAll();
    void store.flush();
  });

  let installInFlight: Promise<void> | null = null;

  server.middlewares.use('/__agent', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    const segments = url.pathname.split('/').filter(Boolean);

    try {
      if (method === 'GET' && url.pathname === '/status') {
        const pm = await detectPackageManager(ctx.userCwd);
        res.setHeader('cache-control', 'no-store');
        return json(res, 200, await agentStatus(ctx.userCwd, providers, pm, ctx.agentEnabled));
      }

      if (!ctx.agentEnabled) return json(res, 404, { error: 'agent panel disabled' });

      if (method === 'POST' && url.pathname === '/install') {
        const guard = validateMutationRequest(req, { requireJsonBody: true });
        if (!guard.ok) return json(res, guard.status, { error: guard.error });
        const body = (await readBody(req)) as { provider?: unknown };
        if (!isProviderId(body.provider)) return json(res, 400, { error: 'invalid provider' });
        const provider = providers[body.provider];
        const pm = await detectPackageManager(ctx.userCwd);
        installInFlight ??= installSdk(pm, provider.sdkPackage, ctx.userCwd).finally(() => {
          installInFlight = null;
        });
        await installInFlight;
        return json(res, 200, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/sessions') {
        res.setHeader('cache-control', 'no-store');
        return json(res, 200, { sessions: store.list() });
      }

      if (method === 'POST' && url.pathname === '/sessions') {
        const guard = validateMutationRequest(req, { requireJsonBody: true });
        if (!guard.ok) return json(res, guard.status, { error: guard.error });
        const body = (await readBody(req)) as { provider?: unknown; slideId?: unknown };
        if (!isProviderId(body.provider)) return json(res, 400, { error: 'invalid provider' });
        const slideId =
          typeof body.slideId === 'string' && SLIDE_ID_RE.test(body.slideId) ? body.slideId : null;
        return json(res, 200, store.create(body.provider, slideId));
      }

      if (segments[0] === 'sessions' && segments[1]) {
        const id = segments[1];
        const action = segments[2];
        const session = store.get(id);
        if (!session) return json(res, 404, { error: 'session not found' });

        if (method === 'GET' && !action) {
          res.setHeader('cache-control', 'no-store');
          return json(res, 200, session);
        }

        if (method === 'DELETE' && !action) {
          const guard = validateMutationRequest(req);
          if (!guard.ok) return json(res, guard.status, { error: guard.error });
          runner.stop(id);
          store.remove(id);
          return json(res, 200, { ok: true });
        }

        if (method === 'POST' && action === 'messages') {
          const guard = validateMutationRequest(req, { requireJsonBody: true });
          if (!guard.ok) return json(res, guard.status, { error: guard.error });
          const body = (await readBody(req)) as {
            text?: unknown;
            context?: unknown;
            autoApprove?: unknown;
          };
          if (typeof body.text !== 'string' || !body.text.trim()) {
            return json(res, 400, { error: 'missing text' });
          }
          if (runner.isRunning(id)) return json(res, 409, { error: 'session is already running' });
          await runner.send(id, {
            text: body.text,
            context: parseContext(body.context),
            autoApprove: body.autoApprove === true,
          });
          return json(res, 202, { ok: true });
        }

        if (method === 'POST' && action === 'stop') {
          const guard = validateMutationRequest(req);
          if (!guard.ok) return json(res, guard.status, { error: guard.error });
          return json(res, 200, { ok: runner.stop(id) });
        }

        if (method === 'POST' && action === 'respond') {
          const guard = validateMutationRequest(req, { requireJsonBody: true });
          if (!guard.ok) return json(res, guard.status, { error: guard.error });
          const body = (await readBody(req)) as { itemId?: unknown };
          const payload = parseRespond(body);
          if (typeof body.itemId !== 'string' || !payload) {
            return json(res, 400, { error: 'invalid response' });
          }
          const ok = runner.respond(id, body.itemId, payload);
          return json(res, ok ? 200 : 409, ok ? { ok } : { error: 'nothing pending' });
        }
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
