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

test('detectLicense recognizes permissive, proprietary and missing licenses', async () => {
  const { detectLicense } = await import('../src/importer.js');
  assert.equal(detectLicense('MIT License\n\nPermission is hereby granted, free of charge, to any person'), 'MIT');
  assert.equal(detectLicense('                                 Apache License\n                           Version 2.0, January 2004'), 'Apache-2.0');
  assert.equal(detectLicense('Apache-2.0'), 'Apache-2.0');
  assert.equal(detectLicense('© 2025 Anthropic, PBC. All rights reserved.'), 'Proprietary');
  assert.equal(detectLicense('GNU GENERAL PUBLIC LICENSE\nVersion 3'), 'GPL-family');
  assert.equal(detectLicense(''), null);
});

test('detectAuthors reads the copyright holder and skips license prose', async () => {
  const { detectAuthors } = await import('../src/importer.js');
  assert.equal(detectAuthors('MIT License\n\nCopyright (c) 2025 Jesse Vincent\n'), 'Jesse Vincent');
  assert.equal(detectAuthors('grant to You a perpetual ... copyright license to reproduce\nCopyright [yyyy] [name of copyright owner]'), null);
});

test('parseRepo accepts owner/repo, URLs and @ref', async () => {
  const { parseRepo } = await import('../src/importer.js');
  assert.deepEqual(parseRepo('obra/superpowers'), { slug: 'obra/superpowers', url: 'https://github.com/obra/superpowers', ref: null });
  assert.deepEqual(parseRepo('https://github.com/anthropics/skills.git@main'), { slug: 'anthropics/skills', url: 'https://github.com/anthropics/skills', ref: 'main' });
});

test('files saved with a UTF-8 BOM (common on Windows) are still read', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { readJsonFile } = await import('../src/paths.js');
  const { scanProject } = await import('../src/detect.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-bom-'));
  fs.writeFileSync(path.join(dir, 'composer.json'), '﻿{"require":{"laravel/framework":"^12.0"}}');
  assert.deepEqual(readJsonFile(path.join(dir, 'composer.json')), { require: { 'laravel/framework': '^12.0' } });
  assert.ok(scanProject(dir).composerDeps.has('laravel/framework'));
  assert.deepEqual(parseFrontmatter('﻿---\nname: x\n---'), { name: 'x' });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('guard flags private terms and secret shapes', async () => {
  const { scanText } = await import('../src/guard.js');
  const fakeKey = 'sk-' + 'a'.repeat(30);
  const hits = scanText(`linea limpia\nproveedor: AcmeIA\nconst api_key = "${fakeKey}";`, ['acmeia']);
  assert.deepEqual(hits.map((h) => h.line), [2, 3, 3]);
  assert.equal(scanText('const x = process.env.API_KEY;', ['acmeia']).length, 0);
});

test('parseFrontmatter supports folded/literal blocks, wrapped values and nested maps', () => {
  const fm = parseFrontmatter('---\nname: x\ndescription: >-\n  Primera linea\n  segunda linea\nmetadata:\n  author: ana\nlicense: MIT\n---');
  assert.deepEqual(fm, { name: 'x', description: 'Primera linea segunda linea', license: 'MIT' });
  assert.equal(parseFrontmatter('---\ndescription: |\n  a\n  b\n---').description, 'a b');
  assert.equal(parseFrontmatter('---\ndescription: texto largo\n  que sigue\n---').description, 'texto largo que sigue');
});

test('parseFrontmatter reads a plain scalar that starts on the next line', () => {
  const fm = parseFrontmatter('---\r\nname: x\r\ndescription:\r\n  React composition patterns\r\n  that scale.\r\nmetadata:\r\n  author: vercel\r\n---');
  assert.equal(fm.description, 'React composition patterns that scale.');
  assert.equal(fm.metadata, undefined);
});

test('every pack points to existing skills', async () => {
  const { loadPacks } = await import('../src/skills.js');
  const names = new Set(loadCatalog().map((s) => s.name));
  for (const [pack, { skills, description }] of Object.entries(loadPacks())) {
    assert.ok(description, `${pack}: sin descripción`);
    for (const s of skills) assert.ok(names.has(s), `pack ${pack}: no existe el skill ${s}`);
  }
});

test('guard ignores documentation placeholders', async () => {
  const { scanText } = await import('../src/guard.js');
  assert.equal(scanText('client = anthropic.Anthropic(api_key="your-api-key-here-123")').length, 0);
  assert.equal(scanText('token: "<tu-token-de-acceso-aqui>"').length, 0);
  const fakeSecret = ['Rq8!zP2', '#mK9$wL4v'].join('');
  assert.equal(scanText('password = "' + fakeSecret + '"').length, 1);
});

test('parseArgs accumulates repeated value flags', () => {
  assert.deepEqual(parseArgs(['add', '--pack', 'base', '--pack', 'react-moderno', 'laravel']), { _: ['add', 'laravel'], pack: 'base,react-moderno' });
});
