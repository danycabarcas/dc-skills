import fs from 'node:fs';
import path from 'node:path';
import { ROOT, writableCatalogDir } from './paths.js';

export const SKILL_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Creates skills/<name>/SKILL.md + dc.json from templates/skill and returns the folder. */
export function createSkill({ name, title, description, keywords = [], requires = [], category = 'other', files = [], npm = [], composer = [] }) {
  if (!SKILL_NAME.test(name)) throw new Error('Nombre inválido: usa minúsculas, números y guiones (ej. "vue", "laravel-livewire").');
  const dir = path.join(writableCatalogDir(), name);
  if (fs.existsSync(dir)) throw new Error(`El skill "${name}" ya existe en ${dir}`);

  const template = fs.readFileSync(path.join(ROOT, 'templates', 'skill', 'SKILL.md'), 'utf8');
  const body = template
    .replaceAll('{{name}}', name)
    .replaceAll('{{title}}', title || name)
    .replaceAll('{{description}}', description || `Convenciones y buenas prácticas de ${title || name}. Úsalo al crear o modificar código ${title || name}.`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
  const meta = { title: title || name, category, requires, detect: { files, composer, npm, keywords: keywords.length ? keywords : [name] } };
  fs.writeFileSync(path.join(dir, 'dc.json'), `${JSON.stringify(meta, null, 2)}\n`);
  return dir;
}
