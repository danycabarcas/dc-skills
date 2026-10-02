import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, loadCatalog, withRequires } from '../src/skills.js';
import { recommend } from '../src/detect.js';
import { parseArgs } from '../src/ui.js';

test('every skill has a valid name, description and known requires', () => {
  const catalog = loadCatalog();
  const names = new Set(catalog.map((s) => s.name));
  for (const skill of catalog) {
    assert.match(skill.name, /^[a-z0-9][a-z0-9-]*$/, skill.dir);
    assert.ok(skill.description.length > 20, `${skill.name}: description too short`);
    for (const req of skill.requires) assert.ok(names.has(req), `${skill.name} requires unknown ${req}`);
  }
});

test('parseFrontmatter reads flat keys', () => {
  assert.deepEqual(parseFrontmatter('---\nname: php\ndescription: "Hola: mundo"\n---\n# x'), { name: 'php', description: 'Hola: mundo' });
});

test('withRequires resolves the dependency chain', () => {
  const resolved = withRequires(['filament'], loadCatalog());
  for (const name of ['filament', 'laravel', 'php', 'tailwind', 'css']) assert.ok(resolved.includes(name), name);
});

test('recommend ranks by description keywords and adds requirements', () => {
  const ranked = recommend(loadCatalog(), null, 'API en NestJS y frontend en Next.js');
  const names = ranked.map((r) => r.skill.name);
  for (const name of ['nestjs', 'nodejs', 'nextjs', 'react', 'dc-core']) assert.ok(names.includes(name), name);
  assert.ok(!names.includes('laravel'));
});

test('recommend detects dependencies from project signals', () => {
  const signals = {
    files: new Set(['artisan', 'composer.json']),
    exts: new Set(['.php']),
    composerDeps: new Set(['laravel/framework', 'filament/filament']),
    npmDeps: new Set(['tailwindcss']),
  };
  const names = recommend(loadCatalog(), signals).map((r) => r.skill.name);
  assert.equal(names[0], 'laravel');
  for (const name of ['php', 'filament', 'tailwind', 'css']) assert.ok(names.includes(name), name);
  assert.ok(!names.includes('nextjs'));
});

test('parseArgs handles positionals, values and booleans', () => {
  assert.deepEqual(parseArgs(['add', 'php', '--dir', 'x', '-y', '--kind=bug']), { _: ['add', 'php'], dir: 'x', yes: true, kind: 'bug' });
});
