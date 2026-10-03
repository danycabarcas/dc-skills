import fs from 'node:fs';
import path from 'node:path';
import { PKG, readJsonFile } from './paths.js';
import { withRequires } from './skills.js';

export const MANIFEST_FILE = 'dc-skills.json';

/**
 * Folders each installed skill is copied into:
 *  - .claude/skills → Claude Code loads them natively as Agent Skills.
 *  - .agents/skills → cross-agent convention used by other AGENTS.md-aware tools, and the
 *                     path referenced from AGENTS.md.
 */
export const DEFAULT_TARGETS = ['.claude/skills', '.agents/skills'];

/** Tiny files that make agents that don't read AGENTS.md natively import it. */
export const DEFAULT_SHIMS = ['CLAUDE.md', 'GEMINI.md'];

const BLOCK_START = '<!-- dc-skills:start -->';
const BLOCK_END = '<!-- dc-skills:end -->';

/** Nearest folder (walking up) with a dc-skills.json; falls back to the start folder. */
export function findProjectRoot(start = process.cwd()) {
  const origin = path.resolve(start);
  let dir = origin;
  while (true) {
    if (fs.existsSync(path.join(dir, MANIFEST_FILE))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return origin;
    dir = parent;
  }
}

export function hasManifest(root) {
  return fs.existsSync(path.join(root, MANIFEST_FILE));
}

/** Private skills of the project: gitignored so internal skills never reach the project's repo. */
export const LOCAL_MANIFEST_FILE = 'dc-skills.local.json';

export function readManifest(root) {
  const defaults = { skills: [], targets: DEFAULT_TARGETS, shims: DEFAULT_SHIMS };
  const file = path.join(root, MANIFEST_FILE);
  const manifest = fs.existsSync(file) ? { ...defaults, ...readJsonFile(file) } : defaults;
  const localFile = path.join(root, LOCAL_MANIFEST_FILE);
  if (fs.existsSync(localFile)) manifest.skills = [...manifest.skills, ...(readJsonFile(localFile).skills || [])];
  return manifest;
}

const isPrivate = (name, catalog) => Boolean(catalog.find((s) => s.name === name)?.private);

function writeManifest(root, manifest, catalog) {
  const all = [...new Set(manifest.skills)].sort();
  const data = {
    $comment: 'Generado por dc-skills. Edita con `dc-skills add/remove`.',
    version: PKG.version,
    skills: all.filter((n) => !isPrivate(n, catalog)),
    targets: manifest.targets,
    shims: manifest.shims,
    ...(manifest.mcp === false ? { mcp: false } : {}),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(root, MANIFEST_FILE), `${JSON.stringify(data, null, 2)}\n`);

  const privateSkills = all.filter((n) => isPrivate(n, catalog));
  const localFile = path.join(root, LOCAL_MANIFEST_FILE);
  if (privateSkills.length) {
    fs.writeFileSync(localFile, `${JSON.stringify({ $comment: 'Skills privados (no se versiona).', skills: privateSkills }, null, 2)}\n`);
  } else {
    fs.rmSync(localFile, { force: true });
  }
}

const GITIGNORE_START = '# dc-skills:private (generado; no editar)';
const GITIGNORE_END = '# dc-skills:private-end';

/** Keeps a managed .gitignore block covering the local manifest and every private skill folder. */
function syncGitignore(root, manifest, catalog) {
  const file = path.join(root, '.gitignore');
  const privateSkills = manifest.skills.filter((n) => isPrivate(n, catalog)).sort();
  const lines = privateSkills.length
    ? [GITIGNORE_START, LOCAL_MANIFEST_FILE, ...privateSkills.flatMap((n) => manifest.targets.map((t) => `${t}/${n}/`)), GITIGNORE_END]
    : [];
  let content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const start = content.indexOf(GITIGNORE_START);
  const end = content.indexOf(GITIGNORE_END);
  if (start !== -1 && end > start) content = (content.slice(0, start) + content.slice(end + GITIGNORE_END.length)).replace(/\n{3,}/g, '\n\n');
  if (lines.length) content = `${content.trimEnd()}${content.trim() ? '\n\n' : ''}${lines.join('\n')}\n`;
  if (content.trim()) fs.writeFileSync(file, content);
  else fs.rmSync(file, { force: true }); // only our block was there
}

function copySkill(skill, root, targets) {
  for (const target of targets) {
    const dest = path.join(root, target, skill.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(skill.dir, dest, { recursive: true, filter: (src) => path.basename(src) !== 'dc.json' });
  }
}

/** Creates the manifest + AGENTS.md block even with no skills (first step in a new folder). */
export function initProject(root, catalog) {
  const manifest = readManifest(root);
  writeManifest(root, manifest, catalog);
  syncAgentsFile(root, manifest, catalog);
  return manifest;
}

/** Installs skills (plus their `requires`) and returns the names actually installed. */
export function installSkills(root, names, catalog) {
  const manifest = readManifest(root);
  const always = catalog.filter((s) => s.always && !manifest.skills.includes(s.name)).map((s) => s.name);
  const resolved = withRequires([...names, ...always], catalog);
  const byName = new Map(catalog.map((s) => [s.name, s]));
  for (const name of resolved) copySkill(byName.get(name), root, manifest.targets);
  manifest.skills = [...manifest.skills, ...resolved];
  writeManifest(root, manifest, catalog);
  syncAgentsFile(root, manifest, catalog);
  return resolved;
}

export function removeSkills(root, names, catalog) {
  const manifest = readManifest(root);
  for (const name of names) {
    for (const target of manifest.targets) {
      fs.rmSync(path.join(root, target, name), { recursive: true, force: true });
    }
  }
  manifest.skills = manifest.skills.filter((s) => !names.includes(s));
  writeManifest(root, manifest, catalog);
  syncAgentsFile(root, manifest, catalog);
}

/** Re-copies installed skills from the catalog (after `git pull` of dc-skills). */
export function updateSkills(root, catalog) {
  const manifest = readManifest(root);
  const byName = new Map(catalog.map((s) => [s.name, s]));
  const missing = [];
  for (const name of manifest.skills) {
    const skill = byName.get(name);
    if (skill) copySkill(skill, root, manifest.targets);
    else missing.push(name);
  }
  writeManifest(root, manifest, catalog);
  syncAgentsFile(root, manifest, catalog);
  return { updated: manifest.skills.filter((n) => !missing.includes(n)), missing };
}

function buildBlock(manifest, catalog) {
  const byName = new Map(catalog.map((s) => [s.name, s]));
  const base = manifest.targets.includes('.agents/skills') ? '.agents/skills' : manifest.targets[0];
  const lines = [
    BLOCK_START,
    '## DC Skills',
    '',
    '> Bloque gestionado por `dc-skills` (no lo edites a mano; usa `dc-skills add/remove`).',
    '',
    '**Protocolo para cualquier agente de IA que trabaje en este proyecto:**',
    '',
    '1. Al iniciar la sesión ejecuta `dc-skills agent-start` y sigue lo que indique (estado, skills, memoria reciente).',
    '2. Antes de escribir código de una tecnología, lee su `SKILL.md` de la tabla de abajo.',
    '3. Guarda en la memoria compartida las decisiones, convenciones y bugs relevantes:',
    '   `dc-skills mem add "<texto>" --agent <tu-nombre> --kind decision|note|bug|todo`',
    '4. Antes de resolver algo que pudo verse antes, busca: `dc-skills mem search "<tema>"`.',
    '5. Si falta un skill o uno se queda corto, puedes proponer crearlo o mejorarlo: sigue el skill `skill-creator`',
    '   (decide tú el tipo, la estructura y el alcance; el usuario aprueba antes de publicar en un catálogo compartido).',
    '',
  ];
  // Private skills are left out on purpose: AGENTS.md is committed. `dc-skills agent-start` lists them.
  const publicSkills = manifest.skills.filter((n) => !isPrivate(n, catalog));
  if (publicSkills.length === 0) {
    lines.push('_Aún no hay skills instalados. Ejecuta `dc-skills agent-start` para proponerlos al usuario._');
  } else {
    lines.push('| Skill | Archivo | Cuándo usarlo |', '|---|---|---|');
    for (const name of [...publicSkills].sort()) {
      const desc = (byName.get(name)?.description || '(no está en el catálogo local)').replace(/\|/g, '\\|');
      lines.push(`| ${name} | \`${base}/${name}/SKILL.md\` | ${desc} |`);
    }
  }
  lines.push(BLOCK_END);
  return lines.join('\n');
}

/**
 * Project-level MCP config files, same `{ mcpServers }` format:
 *  - .mcp.json               → Claude Code (CLI and VS Code)
 *  - .agents/mcp_config.json → Google Antigravity (workspace-local MCP config)
 */
const MCP_CONFIG_FILES = ['.mcp.json', path.join('.agents', 'mcp_config.json')];

/**
 * Registers the dc-skills MCP server in every project MCP config file. Existing servers are kept;
 * set "mcp": false in dc-skills.json to opt out.
 */
function ensureMcpConfig(root) {
  for (const rel of MCP_CONFIG_FILES) ensureMcpConfigFile(path.join(root, rel));
}

function ensureMcpConfigFile(file) {
  let config = { mcpServers: {} };
  if (fs.existsSync(file)) {
    try {
      config = readJsonFile(file);
    } catch {
      return; // never overwrite a file we cannot parse
    }
  }
  config.mcpServers ??= {};
  if (config.mcpServers['dc-skills']) return;
  // On Windows the global command is a .cmd shim, which MCP clients can only start through cmd.
  config.mcpServers['dc-skills'] =
    process.platform === 'win32' ? { command: 'cmd', args: ['/c', 'dc-skills', 'mcp'] } : { command: 'dc-skills', args: ['mcp'] };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

/** Writes/refreshes the dc-skills block inside AGENTS.md and the CLAUDE.md/GEMINI.md shims. */
export function syncAgentsFile(root, manifest, catalog) {
  const file = path.join(root, 'AGENTS.md');
  const block = buildBlock(manifest, catalog);
  let content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `# AGENTS.md · ${path.basename(root)}\n\n`;
  const start = content.indexOf(BLOCK_START);
  const end = content.indexOf(BLOCK_END);
  if (start !== -1 && end > start) {
    content = content.slice(0, start) + block + content.slice(end + BLOCK_END.length);
  } else {
    content = `${content.trimEnd()}\n\n${block}\n`;
  }
  fs.writeFileSync(file, content);

  if (manifest.mcp !== false) ensureMcpConfig(root);
  syncGitignore(root, manifest, catalog);

  for (const shim of manifest.shims) {
    const shimFile = path.join(root, shim);
    if (!fs.existsSync(shimFile)) {
      fs.writeFileSync(shimFile, '@AGENTS.md\n');
    } else if (!fs.readFileSync(shimFile, 'utf8').includes('@AGENTS.md')) {
      fs.appendFileSync(shimFile, '\n@AGENTS.md\n');
    }
  }
}
