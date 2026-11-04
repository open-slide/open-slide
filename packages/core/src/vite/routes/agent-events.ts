import type { IncomingMessage } from 'node:http';
import type { WebSocket, WebSocketServer } from 'vite';
import { AGENT_EVENT, type AgentStreamEvent } from '../../agent/types.ts';
import { isLoopbackRequest } from '../../http/request-guard.ts';

type ConnectionSource = Pick<WebSocketServer, 'on'>;

// Agent output rides the HMR socket every page already holds: a stream of its
// own would pin one of the browser's six connections per host for each open
// tab. Every network client can join that socket when the server runs with
// --host, so only loopback sockets are sent anything.
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
