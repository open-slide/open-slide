import * as readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export type JsonSchema = Record<string, unknown>;

export type ToolAnnotations = {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export type ToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string };

export type ToolResult = {
  content: ToolContent[];
  isError?: boolean;
};

export type Tool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: ToolAnnotations;
  handler: (args: Record<string, unknown>) => Promise<string | ToolResult>;
};

export class ToolError extends Error {}

export type ServerOptions = {
  name: string;
  version: string;
  instructions?: string;
  tools: Tool[];
};

type JsonRpcId = string | number;

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId | null; result: unknown }
  | { jsonrpc: '2.0'; id: JsonRpcId | null; error: { code: number; message: string } };

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

const errorResponse = (id: JsonRpcId | null, code: number, message: string): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  error: { code, message },
});

export function createServer(opts: ServerOptions) {
  const tools = new Map(opts.tools.map((t) => [t.name, t]));

  async function call(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      case 'initialize': {
        const requested = params.protocolVersion;
        const protocolVersion =
          typeof requested === 'string' && PROTOCOL_VERSIONS.includes(requested)
            ? requested
            : PROTOCOL_VERSIONS[0];
        return {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: opts.name, version: opts.version },
          ...(opts.instructions ? { instructions: opts.instructions } : {}),
        };
      }
      case 'ping':
        return {};
      case 'tools/list':
        return {
          tools: opts.tools.map(({ name, description, inputSchema, annotations }) => ({
            name,
            description,
            inputSchema,
            ...(annotations ? { annotations } : {}),
          })),
        };
      case 'tools/call': {
        const tool = typeof params.name === 'string' ? tools.get(params.name) : undefined;
        if (!tool) throw new RpcError(INVALID_PARAMS, `Unknown tool: ${String(params.name)}`);
        const args =
          params.arguments && typeof params.arguments === 'object'
            ? (params.arguments as Record<string, unknown>)
            : {};
        try {
          const out = await tool.handler(args);
          return typeof out === 'string' ? { content: [{ type: 'text', text: out }] } : out;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { content: [{ type: 'text', text: message }], isError: true };
        }
      }
      default:
        throw new RpcError(METHOD_NOT_FOUND, `Method not found: ${method}`);
    }
  }

  async function handleOne(message: unknown): Promise<JsonRpcResponse | null> {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      return errorResponse(null, INVALID_REQUEST, 'Invalid request');
    }
    const msg = message as { id?: unknown; method?: unknown; params?: unknown };
    const hasId = typeof msg.id === 'string' || typeof msg.id === 'number';
    // Responses to server-initiated requests and notifications need no reply.
    if (typeof msg.method !== 'string') {
      return hasId || 'id' in msg ? null : errorResponse(null, INVALID_REQUEST, 'Invalid request');
    }
    if (!hasId) return null;
    const id = msg.id as JsonRpcId;
    const params =
      msg.params && typeof msg.params === 'object' ? (msg.params as Record<string, unknown>) : {};
    try {
      return { jsonrpc: '2.0', id, result: await call(msg.method, params) };
    } catch (err) {
      if (err instanceof RpcError) return errorResponse(id, err.code, err.message);
      return errorResponse(id, -32603, err instanceof Error ? err.message : String(err));
    }
  }

  async function handle(message: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
    if (!Array.isArray(message)) return handleOne(message);
    if (message.length === 0) return errorResponse(null, INVALID_REQUEST, 'Invalid request');
    const responses = (await Promise.all(message.map(handleOne))).filter(
      (r): r is JsonRpcResponse => r !== null,
    );
    return responses.length > 0 ? responses : null;
  }

  async function handleLine(line: string): Promise<string | null> {
    if (!line.trim()) return null;
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      return JSON.stringify(errorResponse(null, PARSE_ERROR, 'Parse error'));
    }
    const response = await handle(message);
    return response ? JSON.stringify(response) : null;
  }

  return { handle, handleLine };
}

class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export function serveStdio(
  server: ReturnType<typeof createServer>,
  input: Readable = process.stdin,
  output: Writable = process.stdout,
): Promise<void> {
  const rl = readline.createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
  const pending = new Set<Promise<void>>();
  rl.on('line', (line) => {
    const task = server.handleLine(line).then((out) => {
      if (out) output.write(`${out}\n`);
    });
    pending.add(task);
    task.finally(() => pending.delete(task));
  });
  return new Promise((resolve) => {
    rl.on('close', () => {
      Promise.allSettled([...pending]).then(() => resolve());
    });
  });
}
