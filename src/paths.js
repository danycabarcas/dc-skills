import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Root of the dc-skills package (the git checkout or the npm global install). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** User data folder: memory DB, locally created skills, config. Never part of any repository. */
export const HOME = process.env.DC_SKILLS_HOME || path.join(os.homedir(), '.dc-skills');

export const DB_PATH = process.env.DC_SKILLS_DB || path.join(HOME, 'memory.db');

/** Personal configuration (private catalogs, private terms for `dc-skills guard`). */
export const CONFIG_PATH = path.join(HOME, 'config.json');

/** JSON.parse of a file, tolerating the UTF-8 BOM that many Windows tools write. */
export function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

export const PKG = readJsonFile(path.join(ROOT, 'package.json'));

/**
 * {
 *   "catalogs": [{ "name": "interno", "path": "C:/laragon/www/dc-skills-internal/skills" }],
 *   "privateTerms": ["palabra-que-nunca-debe-llegar-al-repo-publico"]
 * }
 */
export function readConfig() {
  const defaults = { catalogs: [], privateTerms: [] };
  if (!fs.existsSync(CONFIG_PATH)) return defaults;
  return { ...defaults, ...readJsonFile(CONFIG_PATH) };
}

export function writeConfig(config) {
  fs.mkdirSync(HOME, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

const CONFIG = readConfig();

/**
 * Skill catalogs, in load order (a later catalog overrides a same-named skill):
 *  - repo:    the public dc-skills repository
 *  - private: private catalogs from config.json (e.g. a private git repo for internal skills)
 *  - local:   ~/.dc-skills/skills, personal and never shared
 */
export const CATALOG_DIRS = [
  { dir: path.join(ROOT, 'skills'), source: 'repo', name: 'publico' },
  ...CONFIG.catalogs.map((c) => ({ dir: path.resolve(c.path), source: 'private', name: c.name })),
  { dir: path.join(HOME, 'skills'), source: 'local', name: 'local' },
  ...(process.env.DC_SKILLS_CATALOG ? [{ dir: path.resolve(process.env.DC_SKILLS_CATALOG), source: 'local', name: 'env' }] : []),
];

export const IS_GIT_CHECKOUT = fs.existsSync(path.join(ROOT, '.git'));

/**
 * Where `dc-skills new` and `dc-skills import` write by default. In a git checkout new skills go
 * into the repo so they can be committed and shared; in an npm install they go to the user's local
 * catalog. DC_SKILLS_CATALOG overrides both (useful for tests).
 */
export function writableCatalogDir() {
  if (process.env.DC_SKILLS_CATALOG) return path.resolve(process.env.DC_SKILLS_CATALOG);
  return IS_GIT_CHECKOUT ? path.join(ROOT, 'skills') : path.join(HOME, 'skills');
}

/** Catalog folder for a scope name: "publico", "local" or the name of a private catalog. */
export function catalogDirForScope(scope) {
  if (!scope) return writableCatalogDir();
  if (scope === 'publico') {
    if (!IS_GIT_CHECKOUT) throw new Error('El catálogo público solo se edita desde un clon del repo dc-skills.');
    return path.join(ROOT, 'skills');
  }
  if (scope === 'local') return path.join(HOME, 'skills');
  const found = CONFIG.catalogs.find((c) => c.name === scope);
  if (!found) {
    const names = ['publico', 'local', ...CONFIG.catalogs.map((c) => c.name)].join(', ');
    throw new Error(`No existe el catálogo "${scope}". Disponibles: ${names}. Agrega uno con: dc-skills catalog add <ruta> --name ${scope}`);
  }
  return path.resolve(found.path);
}

/** Stable identifier for a project folder (case-insensitive on Windows). */
export function projectId(root) {
  const id = path.resolve(root).replace(/\\/g, '/');
  return process.platform === 'win32' ? id.toLowerCase() : id;
}
