import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Root of the dc-skills package (the git checkout or the npm global install). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** User data folder: memory DB, locally created skills, config. */
export const HOME = process.env.DC_SKILLS_HOME || path.join(os.homedir(), '.dc-skills');

export const DB_PATH = process.env.DC_SKILLS_DB || path.join(HOME, 'memory.db');

export const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/** Skill catalogs, in load order. A skill in a later catalog overrides one with the same name. */
export const CATALOG_DIRS = [
  { dir: path.join(ROOT, 'skills'), source: 'repo' },
  { dir: path.join(HOME, 'skills'), source: 'local' },
];

export const IS_GIT_CHECKOUT = fs.existsSync(path.join(ROOT, '.git'));

/**
 * Where `dc-skills new` writes. In a git checkout new skills go into the repo so they
 * can be committed and shared; in an npm install they go to the user's local catalog.
 */
export function writableCatalogDir() {
  return IS_GIT_CHECKOUT ? path.join(ROOT, 'skills') : path.join(HOME, 'skills');
}

/** Stable identifier for a project folder (case-insensitive on Windows). */
export function projectId(root) {
  const id = path.resolve(root).replace(/\\/g, '/');
  return process.platform === 'win32' ? id.toLowerCase() : id;
}
