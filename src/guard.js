// Leak guard for git repositories: blocks private terms (kept in ~/.dc-skills/config.json, so the
// list itself is never committed) and common secret shapes. Used by `dc-skills guard` and the
// pre-commit hook it installs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readConfig } from './paths.js';

const SECRET_PATTERNS = [
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/, 'posible API key (sk-...)'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'posible AWS access key'],
  [/\b(?:ghp|gho|ghs)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/, 'posible token de GitHub'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, 'llave privada'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'posible JWT'],
  [/\b(?:api[_-]?key|secret|token|passw(?:or)?d)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i, 'credencial escrita en el código'],
];

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args[0]} falló en ${cwd}: ${(r.stderr || '').trim()}`);
  return r.stdout;
}

// Documentation placeholders ("your-api-key", "<token>", "xxxx") are not secrets.
const PLACEHOLDER = /your[-_ ]?|example|sample|dummy|placeholder|changeme|replace[-_ ]?me|<[^>]*>|x{4,}|\*{4,}|\.\.\.|\$\{|\{\{|tu[-_]|su[-_]/i;

/** Scans a text and returns [{ line, reason }]. */
export function scanText(text, terms = []) {
  const found = [];
  const lowered = terms.map((t) => t.toLowerCase()).filter(Boolean);
  text.split(/\r?\n/).forEach((line, i) => {
    const low = line.toLowerCase();
    for (const term of lowered) if (low.includes(term)) found.push({ line: i + 1, reason: `término privado "${term}"` });
    for (const [re, reason] of SECRET_PATTERNS) {
      const m = line.match(re);
      if (m && !PLACEHOLDER.test(m[0])) found.push({ line: i + 1, reason });
    }
  });
  return found;
}

/** "skills/x/data/*.json" style globs from config.guardAllow → matcher on repo-relative paths. */
function allowMatcher(globs) {
  const res = globs.map((g) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*')}$`));
  return (file) => res.some((re) => re.test(file));
}

/**
 * @param staged true → only what is about to be committed (git index); false → tracked + untracked
 *               files that are not ignored.
 */
export function runGuard({ cwd = process.cwd(), staged = false } = {}) {
  const { privateTerms: terms, guardAllow = [] } = readConfig();
  const allowed = allowMatcher(guardAllow);
  const top = git(['rev-parse', '--show-toplevel'], cwd).trim();
  const files = staged
    ? git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], top).split('\n').filter(Boolean)
    : [...git(['ls-files'], top).split('\n'), ...git(['ls-files', '--others', '--exclude-standard'], top).split('\n')].filter(Boolean);

  const findings = [];
  for (const file of files) {
    if (allowed(file)) continue; // reviewed and accepted by the user (config.guardAllow)
    if (/(^|\/)\.env(\.|$)/.test(file) && !/\.env\.(example|sample|dist)$/.test(file)) {
      findings.push({ file, line: 1, reason: 'archivo .env versionado' });
    }
    let content;
    try {
      content = staged ? git(['show', `:${file}`], top) : fs.readFileSync(path.join(top, file), 'utf8');
    } catch {
      continue; // deleted or unreadable
    }
    if (content.length > 2_000_000 || content.includes('\0')) continue; // binaries and huge files
    for (const hit of scanText(content, terms)) findings.push({ file, ...hit });
    // Private terms in a file *name* leak too.
    for (const term of terms) if (file.toLowerCase().includes(term.toLowerCase())) findings.push({ file, line: 0, reason: `término privado "${term}" en el nombre` });
  }
  return { findings, terms: terms.length };
}

const HOOK_MARK = '# dc-skills guard';

/** Installs a pre-commit hook that runs `dc-skills guard --staged`. Never replaces a foreign hook. */
export function installHook(repoDir) {
  const hooksDir = path.join(git(['rev-parse', '--absolute-git-dir'], repoDir).trim(), 'hooks');
  const file = path.join(hooksDir, 'pre-commit');
  if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(HOOK_MARK)) {
    throw new Error(`Ya existe un hook pre-commit en ${file}. Agrega a mano la línea: dc-skills guard --staged || exit 1`);
  }
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(
    file,
    `#!/bin/sh\n${HOOK_MARK}: bloquea commits con términos privados o secretos\n` +
      'dc-skills guard --staged || { echo "Commit bloqueado por dc-skills guard."; exit 1; }\n',
    { mode: 0o755 },
  );
  return file;
}
