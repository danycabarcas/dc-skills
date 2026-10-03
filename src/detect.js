// Orchestrator: decides which skills fit a project without calling any LLM.
//
// Scoring per skill (rules live in each skill's dc.json → "detect"):
//   +15  a declared dependency is present (composer.json / package.json)
//   +10  a marker file or extension exists in the project (artisan, *.html, ...)
//   +10  the user's description mentions one of its keywords
//   then every `requires` of a matched skill is added, and `always` skills last.
import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile } from './paths.js';

const IGNORED_DIRS = new Set([
  'node_modules', 'vendor', '.git', 'storage', 'dist', 'build', 'out', '.next', '.nuxt',
  '.angular', 'coverage', '.idea', '.vscode', '.claude', '.agents', '.gemini',
]);

const SCORE = { dependency: 15, file: 10, keyword: 10, required: 5, always: 1 };

function readJson(file) {
  try {
    return readJsonFile(file);
  } catch {
    return null;
  }
}

/** Walks the project (bounded) collecting files, extensions and declared dependencies. */
export function scanProject(root, { maxDepth = 3, maxEntries = 5000 } = {}) {
  const files = new Set();
  const exts = new Set();
  const composerDeps = new Set();
  const npmDeps = new Set();
  let seen = 0;

  const walk = (dir, depth) => {
    if (depth > maxDepth || seen > maxEntries) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (++seen > maxEntries) return;
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        files.add(`${rel}/`);
        walk(full, depth + 1);
        continue;
      }
      files.add(rel);
      const ext = path.extname(entry.name).toLowerCase();
      if (ext) exts.add(ext);
      // Monorepos (backend/, frontend/...) declare dependencies below the root too.
      if (depth <= 2 && entry.name === 'composer.json') {
        const json = readJson(full);
        Object.keys({ ...json?.require, ...json?.['require-dev'] }).forEach((d) => composerDeps.add(d));
      }
      if (depth <= 2 && entry.name === 'package.json') {
        const json = readJson(full);
        Object.keys({ ...json?.dependencies, ...json?.devDependencies }).forEach((d) => npmDeps.add(d));
      }
    }
  };

  walk(root, 0);
  return { root, files, exts, composerDeps, npmDeps };
}

function matchFile(signals, pattern) {
  if (pattern.startsWith('*.')) return signals.exts.has(pattern.slice(1).toLowerCase());
  if (signals.files.has(pattern)) return true;
  for (const file of signals.files) if (file.endsWith(`/${pattern}`)) return true;
  return false;
}

function matchDependency(deps, pattern) {
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    for (const dep of deps) if (dep.startsWith(prefix)) return true;
    return false;
  }
  return deps.has(pattern);
}

export function normalizeText(text) {
  return String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function mentions(normalized, keyword) {
  const k = normalizeText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${k}(?=$|[^a-z0-9])`).test(normalized);
}

/**
 * @param catalog  skills from loadCatalog()
 * @param signals  result of scanProject(), or null to rank only by description
 * @param description free text from the user ("tienda en laravel con panel filament")
 * @returns [{ skill, score, reasons[] }] sorted by score
 */
export function recommend(catalog, signals, description = '') {
  const text = normalizeText(description);
  const results = new Map();

  for (const skill of catalog) {
    const d = skill.detect || {};
    let score = 0;
    const reasons = [];
    if (signals) {
      for (const dep of d.composer || []) {
        if (matchDependency(signals.composerDeps, dep)) { score += SCORE.dependency; reasons.push(`composer: ${dep}`); }
      }
      for (const dep of d.npm || []) {
        if (matchDependency(signals.npmDeps, dep)) { score += SCORE.dependency; reasons.push(`npm: ${dep}`); }
      }
      for (const file of d.files || []) {
        if (matchFile(signals, file)) { score += SCORE.file; reasons.push(`archivo ${file}`); }
      }
    }
    if (text) {
      for (const keyword of d.keywords || []) {
        if (mentions(text, keyword)) { score += SCORE.keyword; reasons.push(`mencionas "${keyword}"`); }
      }
    }
    if (score > 0) results.set(skill.name, { skill, score, reasons });
  }

  const byName = new Map(catalog.map((s) => [s.name, s]));
  const queue = [...results.keys()];
  while (queue.length) {
    const name = queue.shift();
    for (const req of byName.get(name)?.requires || []) {
      if (!byName.has(req)) continue;
      const existing = results.get(req);
      const reason = `lo requiere ${name}`;
      if (existing) {
        if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      } else {
        results.set(req, { skill: byName.get(req), score: SCORE.required, reasons: [reason] });
        queue.push(req);
      }
    }
  }

  for (const skill of catalog) {
    if (skill.always && !results.has(skill.name)) {
      results.set(skill.name, { skill, score: SCORE.always, reasons: ['base de todo proyecto'] });
    }
  }

  return [...results.values()].sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
}
