// Minimal MCP server over stdio (newline-delimited JSON-RPC 2.0), no SDK needed.
// Gives any MCP-capable agent (Claude Code, Gemini CLI, Codex, Kimi, Cursor...) native tools
// for the shared memory and the skills catalog of the project it was launched in.
import readline from 'node:readline';
import { PKG } from './paths.js';
import { loadCatalog, skillsFromPacks } from './skills.js';
import { scanProject, recommend } from './detect.js';
import { installSkills } from './install.js';
import { buildStatus } from './report.js';
import * as mem from './memory.js';

const TOOLS = [
  {
    name: 'skills_status',
    description: 'Estado del proyecto: skills instalados (con la ruta de cada SKILL.md), recomendación del orquestador y memoria reciente. Llamar al iniciar la sesión.',
    inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Descripción opcional del proyecto para afinar la recomendación' } } },
  },
  {
    name: 'skills_recommend',
    description: 'Recomienda skills según los archivos del proyecto y una descripción en lenguaje natural.',
    inputSchema: { type: 'object', properties: { description: { type: 'string' } } },
  },
  {
    name: 'skills_install',
    description: 'Instala skills y/o packs en el proyecto (con sus requisitos). Usar solo después de que el usuario confirme cuáles.',
    inputSchema: { type: 'object', properties: { skills: { type: 'array', items: { type: 'string' } }, packs: { type: 'array', items: { type: 'string' } } } },
  },
  {
    name: 'skill_request',
    description: 'Registra que falta un skill para una tecnología usada en el proyecto.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, reason: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'memory_add',
    description: 'Guarda en la memoria compartida entre agentes una decisión, convención, bug o pendiente del proyecto.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Texto autocontenido: qué y por qué' },
        kind: { type: 'string', enum: ['note', 'decision', 'bug', 'todo', 'convention'] },
        tags: { type: 'array', items: { type: 'string' } },
        global: { type: 'boolean', description: 'true si aplica a todos los proyectos' },
      },
      required: ['content'],
    },
  },
  {
    name: 'memory_search',
    description: 'Busca (full-text) en la memoria del proyecto y en la global.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, all_projects: { type: 'boolean' }, limit: { type: 'number' } },
      required: ['query'],
    },
  },
  {
    name: 'memory_recent',
    description: 'Últimas memorias del proyecto.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
  {
    name: 'log_event',
    description: 'Registra un hito en el log del proyecto (qué se hizo).',
    inputSchema: { type: 'object', properties: { message: { type: 'string' }, type: { type: 'string' } }, required: ['message'] },
  },
];

const format = (rows) =>
  rows.length
    ? rows.map((m) => `#${m.id} [${m.kind} · ${m.agent} · ${m.created_at.slice(0, 10)}${m.project ? '' : ' · global'}] ${m.content}`).join('\n')
    : '(sin resultados)';

export function runMcp(ctx) {
  let agent = ctx.agent;
  const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  const base = { project: ctx.id, projectName: ctx.name };

  const call = (name, args = {}) => {
    switch (name) {
      case 'skills_status':
        return buildStatus(ctx.root, { description: args.description || '' });
      case 'skills_recommend': {
        const ranked = recommend(loadCatalog(), scanProject(ctx.root), args.description || '');
        return ranked.map((r) => `${r.skill.name} (${r.score}): ${r.reasons.join(', ')}`).join('\n') || '(sin coincidencias)';
      }
      case 'skills_install': {
        const names = [...(args.skills || []).map((s) => s.toLowerCase()), ...skillsFromPacks(args.packs || [])];
        if (!names.length) throw new Error('Indica skills o packs.');
        const installed = installSkills(ctx.root, names, loadCatalog());
        mem.logEvent({ ...base, agent, type: 'install', message: `Skills instalados: ${installed.join(', ')}` });
        return `Instalados: ${installed.join(', ')}. Lee sus SKILL.md en .agents/skills/<nombre>/SKILL.md`;
      }
      case 'skill_request':
        return `Solicitud #${mem.addSkillRequest({ name: args.name.toLowerCase(), reason: args.reason, project: ctx.id, agent })} registrada.`;
      case 'memory_add': {
        const id = mem.addMemory({
          project: args.global ? null : ctx.id,
          projectName: args.global ? null : ctx.name,
          agent,
          kind: args.kind || 'note',
          content: args.content,
          tags: (args.tags || []).join(','),
        });
        return `Memoria #${id} guardada.`;
      }
      case 'memory_search':
        return format(mem.searchMemories({ query: args.query, project: args.all_projects ? null : ctx.id, limit: args.limit || 20 }));
      case 'memory_recent':
        return format(mem.recentMemories({ project: ctx.id, limit: args.limit || 20 }));
      case 'log_event':
        mem.logEvent({ ...base, agent, type: args.type || 'log', message: args.message });
        return 'Registrado.';
      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  };

  const handle = (msg) => {
    const { id, method, params = {} } = msg;
    const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
    switch (method) {
      case 'initialize':
        if (agent === 'unknown' && params.clientInfo?.name) agent = params.clientInfo.name;
        mem.logEvent({ ...base, agent, type: 'session_start', message: `Sesión MCP iniciada (${agent})` });
        return reply({
          protocolVersion: params.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'dc-skills', version: PKG.version },
          instructions: 'Llama skills_status al iniciar. Lee los SKILL.md indicados antes de escribir código. Guarda decisiones con memory_add y busca con memory_search antes de resolver problemas.',
        });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({ tools: TOOLS });
      case 'tools/call':
        try {
          return reply({ content: [{ type: 'text', text: call(params.name, params.arguments) }] });
        } catch (err) {
          return reply({ content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
        }
      default:
        if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Método no soportado: ${method}` } });
    }
  };

  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (raw) => {
    const line = raw.replace(/^\uFEFF/, ''); // PowerShell pipes may prefix a BOM
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    try {
      handle(msg);
    } catch (err) {
      if (msg.id !== undefined) send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: err.message } });
    }
  });
  return new Promise((resolve) => rl.on('close', resolve));
}
