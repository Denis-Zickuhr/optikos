// Optikos MCP server (stdio, newline-delimited JSON-RPC, no dependencies).
// Gives an AI assistant the same knowledge as the docs site: component spec sheets, live-example configs, tokens, themes, guides.
// Run: `npm run mcp`. Register: see docs/site.md (`.mcp.json` at the repo root already does it for Claude Code).
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { components, guides, tokens, themes } from './docs-data.mjs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const text = (s) => ({ content: [{ type: 'text', text: s }] });
const json = (o) => text(JSON.stringify(o, null, 2));
const find = (name) => components().find((c) => c.name === String(name).toLowerCase() || c.type === String(name).toLowerCase());
const fail = (m) => ({ ...text(m), isError: true });

const TOOLS = [
  { name: 'list_components', description: 'Every Optikos component: name, type, category and one-line purpose.', input: {}, run: () => json(components().map(({ name, type, category, summary }) => ({ name, type, category, summary }))) },
  {
    name: 'get_component',
    description: 'The full spec sheet of one component (purpose, anatomy, config, API, events, states, keyboard/ARIA, tokens).',
    input: { name: { type: 'string', description: "component name or type, e.g. 'grid'" } },
    required: ['name'],
    run: ({ name }) => {
      const c = find(name);
      return c ? text(`# ${c.title} (type: '${c.type}')\n\n` + Object.entries(c.fields).map(([k, v]) => `**${k}:** ${v}`).join('\n\n')) : fail(`Unknown component "${name}". Use list_components.`);
    },
  },
  {
    name: 'get_examples',
    description: 'Runnable example configs of a component (plain JSON for `create({...})`; `launch` says how the docs site shows it).',
    input: { name: { type: 'string' } },
    required: ['name'],
    run: ({ name }) => {
      const c = find(name);
      return c ? json(c.examples) : fail(`Unknown component "${name}".`);
    },
  },
  {
    name: 'search_docs',
    description: 'Case-insensitive search over spec sheets and guides. Returns matching lines with where they came from.',
    input: { query: { type: 'string' } },
    required: ['query'],
    run: ({ query }) => {
      const q = String(query).toLowerCase();
      const hits = [];
      for (const c of components()) for (const [k, v] of Object.entries(c.fields)) for (const l of v.split('\n')) if (l.toLowerCase().includes(q)) hits.push(`${c.name} · ${k}: ${l.slice(0, 240)}`);
      for (const g of guides()) for (const l of g.markdown.split('\n')) if (l.toLowerCase().includes(q)) hits.push(`guide ${g.name}: ${l.trim().slice(0, 240)}`);
      return text(hits.slice(0, 40).join('\n') || 'No matches.');
    },
  },
  {
    name: 'get_guide',
    description: 'A guide in full: architecture (decisions), theming, motion or catalog.',
    input: { name: { type: 'string', enum: guides().map((g) => g.name) } },
    required: ['name'],
    run: ({ name }) => {
      const g = guides().find((x) => x.name === name);
      return g ? text(g.markdown) : fail(`Unknown guide "${name}".`);
    },
  },
  {
    name: 'get_tokens',
    description: 'Design tokens (--op-*) with their default values, optionally filtered by a prefix such as "button" or "color".',
    input: { prefix: { type: 'string', description: 'e.g. "color", "button"' } },
    run: ({ prefix } = {}) => json(Object.fromEntries(Object.entries(tokens()).filter(([k]) => !prefix || k.startsWith(`--op-${prefix}`)))),
  },
  { name: 'list_themes', description: 'The shipped themes (data-op-theme values; combine with "compact").', input: {}, run: () => json(themes()) },
];

function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
  const error = (code, message) => id !== undefined && send({ jsonrpc: '2.0', id, error: { code, message } });
  switch (method) {
    case 'initialize':
      return reply({ protocolVersion: params?.protocolVersion ?? '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'optikos', version } });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: { type: 'object', properties: t.input, required: t.required ?? [] } })) });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return error(-32602, `Unknown tool ${params?.name}`);
      try {
        return reply(tool.run(params.arguments ?? {}));
      } catch (e) {
        return reply(fail(String(e?.message ?? e)));
      }
    }
    default:
      return method?.startsWith('notifications/') ? undefined : error(-32601, `Method not found: ${method}`);
  }
}

const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  try {
    handle(JSON.parse(line));
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
});
