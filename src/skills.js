import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_DIRS } from './paths.js';

/** Minimal YAML frontmatter reader: only flat `key: value` lines (all SKILL.md needs). */
export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (!match) return data;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return data;
}

function readSkill(skillDir, source) {
  const file = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(file)) return null;
  const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  let meta = {};
  const metaFile = path.join(skillDir, 'dc.json');
  if (fs.existsSync(metaFile)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
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
    dir: skillDir,
    source,
  };
}

const CATEGORY_ORDER = ['meta', 'language', 'framework', 'frontend', 'styles', 'other'];

export function loadCatalog() {
  const byName = new Map();
  for (const { dir, source } of CATALOG_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skill = readSkill(path.join(dir, entry.name), source);
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
