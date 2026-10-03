import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_DIRS, ROOT, readConfig, readJsonFile } from './paths.js';

/** Minimal YAML frontmatter reader: only flat `key: value` lines (all SKILL.md needs). */
export function parseFrontmatter(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (!match) return data;
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    // Indented lines that follow belong to this key: a block scalar (`>`, `|`, `>-`...), a plain
    // value wrapped over several lines, or a nested map (e.g. `metadata:`), which is skipped.
    const block = [];
    while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
    if (/^[>|][+-]?$/.test(value)) value = block.join(' ');
    else if (value === '') {
      if (!block.length || block.every((l) => /^[\w-]+:(\s|$)/.test(l) || l.startsWith('- '))) continue; // nested map/list
      value = block.join(' '); // plain scalar that starts on the next line
    }
    else if (block.length) value = [value, ...block].join(' ');
    data[kv[1]] = value.replace(/^(['"])(.*)\1$/s, '$2');
  }
  return data;
}

function readSkill(skillDir, source, catalog) {
  const file = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(file)) return null;
  const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  let meta = {};
  const metaFile = path.join(skillDir, 'dc.json');
  if (fs.existsSync(metaFile)) {
    try {
      meta = readJsonFile(metaFile);
    } catch (err) {
      throw new Error(`dc.json inválido en ${skillDir}: ${err.message}`);
    }
  }
  const name = fm.name || path.basename(skillDir);
  return {
    name,
    title: meta.title || name,
    description: fm.description || '',
    category: meta.category || 'other',
    requires: meta.requires || [],
    detect: meta.detect || {},
    always: Boolean(meta.always),
    origin: meta.source || null, // set for skills imported from third-party repos
    dir: skillDir,
    source,
    catalog,
    // Skills from private catalogs (or flagged "private") must never reach a public repository.
    private: source === 'private' || Boolean(meta.private),
  };
}

const CATEGORY_ORDER = ['meta', 'workflow', 'language', 'framework', 'frontend', 'styles', 'database', 'architecture', 'quality', 'seo', 'ai', 'brand', 'other'];

export function loadCatalog() {
  const byName = new Map();
  for (const { dir, source, name } of CATALOG_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skill = readSkill(path.join(dir, entry.name), source, name);
      if (skill) byName.set(skill.name, skill);
    }
  }
  return [...byName.values()].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name),
  );
}

/** Adds every transitive `requires` of the given skill names, keeping input order first. */
export function withRequires(names, catalog) {
  const byName = new Map(catalog.map((s) => [s.name, s]));
  const result = [];
  const visit = (name) => {
    if (result.includes(name)) return;
    const skill = byName.get(name);
    if (!skill) throw new Error(`No existe el skill "${name}". Usa \`dc-skills list\` para ver el catálogo.`);
    result.push(name);
    skill.requires.forEach(visit);
  };
  names.forEach(visit);
  return result;
}

/**
 * Skill packs: repo `packs.json` plus private packs from ~/.dc-skills/config.json ("packs").
 * @returns {Record<string, { description: string, skills: string[], private?: boolean }>}
 */
export function loadPacks() {
  const file = path.join(ROOT, 'packs.json');
  const packs = {};
  if (fs.existsSync(file)) {
    for (const [name, pack] of Object.entries(readJsonFile(file))) if (!name.startsWith('$')) packs[name] = pack;
  }
  for (const [name, pack] of Object.entries(readConfig().packs || {})) packs[name] = { ...pack, private: true };
  return packs;
}

/** Expands pack names into skill names (error on unknown packs). */
export function skillsFromPacks(names) {
  const packs = loadPacks();
  return names.flatMap((name) => {
    if (!packs[name]) throw new Error(`No existe el pack "${name}". Usa \`dc-skills packs\` para verlos.`);
    return packs[name].skills;
  });
}
