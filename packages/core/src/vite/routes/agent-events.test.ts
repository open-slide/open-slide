import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'vite';
import { describe, expect, it } from 'vitest';
import { AGENT_EVENT, type AgentStreamEvent } from '../../agent/types.ts';
import { createAgentBroadcast } from './agent-events.ts';

class FakeSocket extends EventEmitter {
  readonly OPEN = 1;
  readyState = 1;
  sent: string[] = [];
  send(frame: string) {
    this.sent.push(frame);
  }
}

function setup(enabled = true) {
  let onConnection: ((socket: WebSocket, req: IncomingMessage) => void) | undefined;
  const ws = {
    on: (event: string, listener: typeof onConnection) => {
      if (event === 'connection') onConnection = listener;
    },
  };
  const broadcast = createAgentBroadcast(ws as never, enabled);
  const connect = (remoteAddress: string) => {
    const socket = new FakeSocket();
    onConnection?.(
      socket as unknown as WebSocket,
      { socket: { remoteAddress } } as unknown as IncomingMessage,
    );
    return socket;
  };
  return { broadcast, connect };
}

const event: AgentStreamEvent = { type: 'session-removed', sessionId: 's1' };

describe('createAgentBroadcast', () => {
  it('sends agent events as an HMR custom event to loopback sockets', () => {
    const { broadcast, connect } = setup();
    const v4 = connect('127.0.0.1');
    const v6 = connect('::1');
    const mapped = connect('::ffff:127.0.0.1');
    broadcast(event);
    for (const socket of [v4, v6, mapped]) {
      expect(socket.sent.map((f) => JSON.parse(f))).toEqual([
        { type: 'custom', event: AGENT_EVENT, data: event },
      ]);
    }
  });

  it('never sends to network clients', () => {
    const { broadcast, connect } = setup();
    const lan = connect('192.168.1.20');
    broadcast(event);
    expect(lan.sent).toEqual([]);
  });

  it('sends nothing when the agent is disabled', () => {
    const { broadcast, connect } = setup(false);
    const local = connect('127.0.0.1');
    broadcast(event);
    expect(local.sent).toEqual([]);
  });

  it('skips sockets that are closing or closed', () => {
    const { broadcast, connect } = setup();
    const closing = connect('127.0.0.1');
    closing.readyState = 2;
    const closed = connect('127.0.0.1');
    closed.emit('close');
    closed.readyState = 1;
    broadcast(event);
    expect(closing.sent).toEqual([]);
    expect(closed.sent).toEqual([]);
  });
});
