import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createServer, serveStdio, ToolError } from './protocol.ts';

const server = createServer({
  name: 'test',
  version: '1.2.3',
  instructions: 'be nice',
  tools: [
    {
      name: 'echo',
      description: 'echo',
      inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
      annotations: { readOnlyHint: true },
      handler: async (args) => String(args.text),
    },
    {
      name: 'fail',
      description: 'fail',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        throw new ToolError('nope');
      },
    },
  ],
});

describe('mcp protocol', () => {
  it('negotiates the protocol version', async () => {
    const known = await server.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26' },
    });
    expect(known).toMatchObject({
      id: 1,
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'test', version: '1.2.3' },
        instructions: 'be nice',
        capabilities: { tools: {} },
      },
    });
    const unknown = await server.handle({
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: { protocolVersion: '1999-01-01' },
    });
    expect(unknown).toMatchObject({ result: { protocolVersion: '2025-06-18' } });
  });

  it('lists tools without their handlers', async () => {
    const res = (await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' })) as {
      result: { tools: Array<Record<string, unknown>> };
    };
    expect(res.result.tools.map((t) => t.name)).toEqual(['echo', 'fail']);
    expect(res.result.tools[0]).not.toHaveProperty('handler');
    expect(res.result.tools[0].annotations).toEqual({ readOnlyHint: true });
  });

  it('calls tools and reports tool errors in the result', async () => {
    expect(
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'echo', arguments: { text: 'hi' } },
      }),
    ).toEqual({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: 'hi' }] } });
    expect(
      await server.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'fail' },
      }),
    ).toMatchObject({ result: { content: [{ text: 'nope' }], isError: true } });
    expect(
      await server.handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'x' } }),
    ).toMatchObject({ error: { code: -32602 } });
  });

  it('ignores notifications and rejects unknown methods', async () => {
    expect(await server.handle({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBe(null);
    expect(await server.handle({ jsonrpc: '2.0', id: 9, method: 'nope' })).toMatchObject({
      id: 9,
      error: { code: -32601 },
    });
    expect(await server.handleLine('{oops')).toContain('-32700');
  });

  it('speaks newline-delimited JSON over streams', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on('data', (c) => chunks.push(String(c)));
    const done = serveStdio(server, input, output);
    input.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })}\n`);
    input.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
    input.end();
    await done;
    expect(chunks.join('')).toBe(`${JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} })}\n`);
  });
});
