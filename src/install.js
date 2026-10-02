import fs from 'node:fs';
import path from 'node:path';
import { PKG } from './paths.js';
import { withRequires } from './skills.js';

export const MANIFEST_FILE = 'dc-skills.json';

/**
 * Folders each installed skill is copied into:
 *  - .claude/skills → Claude Code loads them natively as Agent Skills.
 *  - .agents/skills → cross-agent convention (Codex, Gemini, Kimi, Cursor...) and the
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

export function readManifest(root) {
  const defaults = { skills: [], targets: DEFAULT_TARGETS, shims: DEFAULT_SHIMS };
  const file = path.join(root, MANIFEST_FILE);
  if (!fs.existsSync(file)) return defaults;
  return { ...defaults, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function writeManifest(root, manifest) {
  const data = {
    $comment: 'Generado por dc-skills. Edita con `dc-skills add/remove`.',
    version: PKG.version,
    skills: [...new Set(manifest.skills)].sort(),
    targets: manifest.targets,
    shims: manifest.shims,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(root, MANIFEST_FILE), `${JSON.stringify(data, null, 2)}\n`);
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
  writeManifest(root, manifest);
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
  writeManifest(root, manifest);
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
  writeManifest(root, manifest);
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
  writeManifest(root, manifest);
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
    '**Protocolo para cualquier agente (Claude, Gemini, Codex, Kimi, ...):**',
    '',
    '1. Al iniciar la sesión ejecuta `dc-skills agent-start` y sigue lo que indique (estado, skills, memoria reciente).',
    '2. Antes de escribir código de una tecnología, lee su `SKILL.md` de la tabla de abajo.',
    '3. Guarda en la memoria compartida las decisiones, convenciones y bugs relevantes:',
    '   `dc-skills mem add "<texto>" --agent <tu-nombre> --kind decision|note|bug|todo`',
    '4. Antes de resolver algo que pudo verse antes, busca: `dc-skills mem search "<tema>"`.',
    '5. Si el proyecto usa una tecnología sin skill: `dc-skills request <nombre> "<motivo>"` y avisa al usuario.',
    '',
  ];
  if (manifest.skills.length === 0) {
    lines.push('_Aún no hay skills instalados. Ejecuta `dc-skills agent-start` para proponerlos al usuario._');
  } else {
    lines.push('| Skill | Archivo | Cuándo usarlo |', '|---|---|---|');
    for (const name of [...manifest.skills].sort()) {
      const desc = (byName.get(name)?.description || '(no está en el catálogo local)').replace(/\|/g, '\\|');
      lines.push(`| ${name} | \`${base}/${name}/SKILL.md\` | ${desc} |`);
    }
  }
  lines.push(BLOCK_END);
  return lines.join('\n');
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

  for (const shim of manifest.shims) {
    const shimFile = path.join(root, shim);
    if (!fs.existsSync(shimFile)) {
      fs.writeFileSync(shimFile, '@AGENTS.md\n');
    } else if (!fs.readFileSync(shimFile, 'utf8').includes('@AGENTS.md')) {
      fs.appendFileSync(shimFile, '\n@AGENTS.md\n');
    }
  }
}
