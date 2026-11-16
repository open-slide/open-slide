import type { IncomingMessage } from 'node:http';
import type { WebSocket, WebSocketServer } from 'vite';
import { AGENT_EVENT, type AgentStreamEvent } from '../../agent/types.ts';
import { isLoopbackRequest } from '../../http/request-guard.ts';

type ConnectionSource = Pick<WebSocketServer, 'on'>;

// Rides the HMR socket every page already holds: a stream per tab would use up
// the browser's six connections per host. Any network client can join that
// socket under --host, so only loopback sockets are sent events.
export function createAgentBroadcast(
  ws: ConnectionSource,
  enabled: boolean,
): (event: AgentStreamEvent) => void {
  const sockets = new Set<WebSocket>();
  ws.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    if (!enabled || !isLoopbackRequest(req)) return;
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  return (event) => {
    const frame = JSON.stringify({ type: 'custom', event: AGENT_EVENT, data: event });
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) socket.send(frame);
    }
  };
}
