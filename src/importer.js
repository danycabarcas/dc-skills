// Imports skills from third-party git repositories into the catalog, keeping license and credits.
//
//   dc-skills import obra/superpowers --list
//   dc-skills import obra/superpowers systematic-debugging writing-plans
//   dc-skills import https://github.com/anthropics/skills@main webapp-testing --as web-testing
//
// Only permissive licenses are accepted. Each imported skill gets its LICENSE, a CREDITS.md, a credits
// note at the end of SKILL.md and a `source` block in dc.json (repo, path, commit, license, authors).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HOME, readJsonFile, writableCatalogDir } from './paths.js';
import { parseFrontmatter, loadCatalog } from './skills.js';
import { SKILL_NAME } from './scaffold.js';

export const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0', 'CC-BY-4.0']);

const CREDITS_MARK = '<!-- dc-skills:credits -->';
const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt))?$/i;

/** Best-effort SPDX id from a license text or a frontmatter `license:` value. */
export function detectLicense(text) {
  if (!text) return null;
  const t = String(text);
  if (/^\s*(MIT|Apache-2\.0|BSD-[23]-Clause|ISC|0BSD|Unlicense|CC0-1\.0|CC-BY-4\.0)\s*$/i.test(t)) {
    return [...PERMISSIVE].find((id) => id.toLowerCase() === t.trim().toLowerCase());
  }
  if (/proprietary|all rights reserved/i.test(t) && !/permission is hereby granted|apache license/i.test(t)) return 'Proprietary';
  if (/permission is hereby granted, free of charge/i.test(t) || /\bMIT License\b/i.test(t)) return 'MIT';
  if (/apache license[\s\S]{0,40}version 2\.0/i.test(t)) return 'Apache-2.0';
  if (/redistribution and use in source and binary forms/i.test(t)) return /neither the name/i.test(t) ? 'BSD-3-Clause' : 'BSD-2-Clause';
  if (/\bISC License\b/i.test(t) || /permission to use, copy, modify, and\/or distribute/i.test(t)) return 'ISC';
  if (/this is free and unencumbered software/i.test(t)) return 'Unlicense';
  if (/CC0 1\.0|creative commons zero/i.test(t)) return 'CC0-1.0';
  if (/attribution 4\.0 international/i.test(t)) return 'CC-BY-4.0';
  if (/GNU (AFFERO |LESSER )?GENERAL PUBLIC LICENSE/i.test(t)) return 'GPL-family';
  return null;
}

/** "Copyright (c) 2025 Jesse Vincent" → "Jesse Vincent" (ignores template placeholders). */
export function detectAuthors(text) {
  for (const line of String(text || '').split(/\r?\n/)) {
    // A real notice has a year ("Copyright (c) 2025 Jesse Vincent"); this skips license prose like
    // Apache's "copyright license to reproduce...".
    const m = line.match(/(?:copyright|©)\s*(?:\(c\)|©)?\s*\d{4}(?:\s*[-–]\s*\d{4})?,?\s+(.+)$/i);
    if (m && !/\[|\{|owner|holders|notice/i.test(m[1])) return m[1].replace(/\.?\s*all rights reserved\.?/i, '').trim().replace(/\.$/, '');
  }
  return null;
}

export function parseRepo(input) {
  // "@ref" only counts after the last "/" so ssh URLs (git@github.com:owner/repo) keep working.
  const at = input.lastIndexOf('@');
  const hasRef = at > input.lastIndexOf('/');
  const spec = (hasRef ? input.slice(0, at) : input).replace(/\.git$/, '');
  const ref = hasRef ? input.slice(at + 1) : null;
  const m = spec.match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/);
  if (m) return { slug: `${m[1]}/${m[2]}`, url: `https://github.com/${m[1]}/${m[2]}`, ref };
  if (/^(https?:|git@)/.test(spec)) return { slug: spec.replace(/^.*[/:]([\w.-]+\/[\w.-]+)$/, '$1'), url: spec, ref };
  throw new Error(`Repositorio no reconocido: "${input}". Usa owner/repo o una URL de git.`);
}

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falló: ${(r.stderr || '').trim()}`);
  return r.stdout.trim();
}

/** Shallow clone (or refresh) into ~/.dc-skills/cache/repos and return the checkout. */
export function fetchRepo(repo) {
  const dir = path.join(HOME, 'cache', 'repos', repo.slug.replace(/[/\\]/g, '__'));
  if (fs.existsSync(path.join(dir, '.git'))) {
    git(['fetch', '--depth', '1', 'origin', repo.ref || 'HEAD'], dir);
    git(['reset', '--hard', 'FETCH_HEAD'], dir);
  } else {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    git(['clone', '--depth', '1', ...(repo.ref ? ['--branch', repo.ref] : []), repo.url, dir]);
  }
  return { dir, commit: git(['rev-parse', 'HEAD'], dir), ref: repo.ref || git(['rev-parse', '--abbrev-ref', 'HEAD'], dir) };
}

function findLicenseFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const name = fs.readdirSync(dir).find((f) => LICENSE_FILE.test(f));
  return name ? path.join(dir, name) : null;
}

/** Every folder with a SKILL.md, with its resolved license. */
export function scanRepoSkills(checkout) {
  const rootLicenseFile = findLicenseFile(checkout);
  const rootLicenseText = rootLicenseFile ? fs.readFileSync(rootLicenseFile, 'utf8') : '';
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 6) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ['.git', 'node_modules'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const skillFile = path.join(full, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const fm = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
        const ownFile = findLicenseFile(full);
        const ownText = ownFile ? fs.readFileSync(ownFile, 'utf8') : '';
        // Precedence: license file in the skill folder → frontmatter → repository root.
        const license = detectLicense(ownText) || detectLicense(fm.license) || detectLicense(rootLicenseText);
        const licenseFile = ownFile || rootLicenseFile;
        found.push({
          name: fm.name || entry.name,
          description: fm.description || '',
          dir: full,
          relPath: path.relative(checkout, full).split(path.sep).join('/'),
          license: license || 'NINGUNA',
          licenseFile,
          authors: detectAuthors(ownText) || detectAuthors(rootLicenseText),
        });
      }
      walk(full, depth + 1);
    }
  };
  walk(checkout, 0);
  // Some repos ship the same skill in several folders (plugins, mirrors): keep the shallowest copy.
  const byName = new Map();
  for (const s of found.sort((a, b) => a.relPath.split('/').length - b.relPath.split('/').length)) {
    if (!byName.has(s.name)) byName.set(s.name, s);
  }
  return [...byName.values()].sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function creditsLine(meta) {
  const by = ` por ${meta.authors || `colaboradores de ${meta.repo}`}`;
  return `> **Créditos:** skill original de [${meta.repo}](${meta.url})${by} · Licencia ${meta.license} · Detalles en \`CREDITS.md\`.`;
}

function writeCredits(dest, meta) {
  const lines = [
    `# Créditos · ${meta.name}`,
    '',
    'Este skill proviene de un proyecto de terceros y se redistribuye respetando su licencia.',
    '',
    `- **Proyecto:** [${meta.repo}](${meta.repoUrl})`,
    `- **Original:** [${meta.path}](${meta.url}) (commit \`${meta.commit.slice(0, 12)}\`)`,
    `- **Autor/es:** ${meta.authors || `colaboradores de ${meta.repo}`}`,
    `- **Licencia:** ${meta.license} (texto completo en \`LICENSE\`)`,
    `- **Importado:** ${meta.importedAt.slice(0, 10)} con \`dc-skills import\``,
    `- **Cambios respecto al original:** ${meta.renamedFrom ? `renombrado de \`${meta.renamedFrom}\` a \`${meta.name}\`; ` : ''}${meta.exclude ? `se omitieron ${meta.exclude.map((e) => `\`${e}\``).join(', ')} (no necesarios para usar el skill); ` : ''}se agregó la nota de créditos al final de \`SKILL.md\`, este archivo y \`dc.json\`. El resto del contenido no se modificó.`,
    '',
  ];
  fs.writeFileSync(path.join(dest, 'CREDITS.md'), lines.join('\n'));
}

/**
 * Copies one scanned skill into the writable catalog.
 * @returns the dc.json `source` block written
 */
/** "test/" → folder prefix · "examples/*.html" → glob (`*` within a folder, `**` across folders). */
function excludeMatcher(patterns) {
  const res = patterns.map((p) => {
    if (p.endsWith('/')) return (rel) => rel === p.slice(0, -1) || rel.startsWith(p);
    const re = new RegExp(`^${p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`);
    return (rel) => re.test(rel);
  });
  return (rel) => res.some((m) => m(rel));
}

export function importSkill(skill, { repo, checkout, as, category = 'other', allowAnyLicense = false, exclude = [] }) {
  if (!PERMISSIVE.has(skill.license) && !allowAnyLicense) {
    throw new Error(
      `"${skill.name}" tiene licencia ${skill.license}: no se puede copiar ni redistribuir. ` +
        (skill.license === 'NINGUNA' ? 'Sin licencia = todos los derechos reservados.' : 'Solo se aceptan licencias permisivas.'),
    );
  }
  const name = (as || skill.name).toLowerCase();
  if (!SKILL_NAME.test(name)) throw new Error(`Nombre inválido "${name}": usa --as <nombre-en-minusculas>.`);

  const dest = path.join(writableCatalogDir(), name);
  const existingMeta = fs.existsSync(path.join(dest, 'dc.json')) ? readJsonFile(path.join(dest, 'dc.json')) : null;
  // Check the whole catalog: a same-named skill in any catalog would be silently overridden.
  const clash = loadCatalog().find((s) => s.name === name);
  if ((clash && clash.origin?.repo !== repo.slug) || (fs.existsSync(dest) && existingMeta?.source?.repo !== repo.slug)) {
    throw new Error(`Ya existe un skill "${name}" que no viene de ${repo.slug}. Impórtalo con otro nombre: --as <nombre>.`);
  }

  const meta = {
    name,
    renamedFrom: name !== skill.name ? skill.name : undefined,
    repo: repo.slug,
    repoUrl: repo.url,
    path: skill.relPath,
    url: `${repo.url}/tree/${checkout.commit}/${skill.relPath}`,
    ref: checkout.ref,
    commit: checkout.commit,
    license: skill.license,
    authors: skill.authors,
    importedAt: new Date().toISOString(),
  };

  meta.exclude = exclude.length ? exclude : undefined;
  const excluded = excludeMatcher(exclude);
  // Empty the folder instead of deleting it: Windows refuses to remove a folder that an editor,
  // Explorer or a shell has open.
  if (fs.existsSync(dest)) for (const f of fs.readdirSync(dest)) fs.rmSync(path.join(dest, f), { recursive: true, force: true });
  fs.cpSync(skill.dir, dest, {
    recursive: true,
    filter: (src) => !excluded(path.relative(skill.dir, src).split(path.sep).join('/')),
  });
  if (skill.licenseFile && !findLicenseFile(dest)) fs.copyFileSync(skill.licenseFile, path.join(dest, 'LICENSE'));
  const notice = path.join(checkout.dir, 'NOTICE');
  if (meta.license === 'Apache-2.0' && fs.existsSync(notice)) fs.copyFileSync(notice, path.join(dest, 'NOTICE'));

  const skillFile = path.join(dest, 'SKILL.md');
  let body = fs.readFileSync(skillFile, 'utf8');
  if (meta.renamedFrom) body = body.replace(/^(---\r?\n[\s\S]*?^name:\s*).+$/m, `$1${name}`);
  body = `${body.trimEnd()}\n\n---\n${CREDITS_MARK}\n${creditsLine(meta)}\n`;
  fs.writeFileSync(skillFile, body);

  writeCredits(dest, meta);
  const { name: _n, renamedFrom: _r, ...source } = meta;
  const words = name.split('-').filter((w) => w.length > 3);
  const dcJson = {
    title: existingMeta?.title || name,
    category: existingMeta?.category || category,
    requires: existingMeta?.requires || [],
    detect: existingMeta?.detect || { keywords: [name.replace(/-/g, ' '), ...words] },
    source: { ...source, originalName: meta.renamedFrom || skill.name },
  };
  fs.writeFileSync(path.join(dest, 'dc.json'), `${JSON.stringify(dcJson, null, 2)}\n`);
  return dcJson.source;
}

/** Regenerates CREDITS.md at the catalog root from every skill's dc.json `source`. */
export function writeCatalogCredits() {
  const imported = loadCatalog().filter((s) => s.origin);
  const lines = [
    '# Créditos de terceros',
    '',
    'Skills del catálogo que provienen de otros proyectos. Cada carpeta incluye su `LICENSE` y `CREDITS.md`.',
    'Este archivo se genera con `dc-skills credits`.',
    '',
  ];
  if (!imported.length) lines.push('_Aún no hay skills importados._');
  else {
    lines.push('| Skill | Proyecto original | Autor/es | Licencia | Commit |', '|---|---|---|---|---|');
    for (const s of imported) {
      const o = s.origin;
      lines.push(`| ${s.name} | [${o.repo}](${o.url}) | ${o.authors || '—'} | ${o.license} | \`${o.commit.slice(0, 7)}\` |`);
    }
  }
  // CREDITS.md lives next to the writable catalog: the repo root in a git checkout, else ~/.dc-skills.
  const file = path.join(path.dirname(writableCatalogDir()), 'CREDITS.md');
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return { file, count: imported.length };
}
