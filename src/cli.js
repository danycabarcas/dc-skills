import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, HOME, DB_PATH, CATALOG_DIRS, CONFIG_PATH, IS_GIT_CHECKOUT, PKG, catalogDirForScope, projectId, readConfig, writeConfig, writableCatalogDir } from './paths.js';
import { loadCatalog, loadPacks, skillsFromPacks } from './skills.js';
import { scanProject, recommend } from './detect.js';
import { findProjectRoot, hasManifest, readManifest, initProject, installSkills, removeSkills, updateSkills, syncAgentsFile } from './install.js';
import { c, ask, confirm, multiSelect, parseArgs, isInteractive } from './ui.js';

const HELP = `
${c.bold('dc-skills')} ${c.dim(`v${PKG.version}`)} · DAYTECHCO SKILLS para agentes de IA

${c.bold('Uso')}
  dc-skills                      Menú interactivo para el proyecto actual
  dc-skills init                 Prepara el proyecto (AGENTS.md + dc-skills.json)
  dc-skills agent-start          Estado para el agente al iniciar sesión (markdown)

${c.bold('Skills')}
  dc-skills list                 Catálogo completo
  dc-skills installed            Skills instalados en este proyecto
  dc-skills recommend ["desc"]   Recomendación del orquestador (detecta + descripción)
  dc-skills add <skills...> [-y] Instala skills (y sus requisitos)
  dc-skills add --pack calidad,datos   Instala packs de skills · dc-skills packs (ver packs)
  dc-skills remove <skills...>   Quita skills del proyecto
  dc-skills update               Re-copia los skills instalados desde el catálogo
  dc-skills new <nombre>         Crea un skill (--scope publico|<privado>|local|proyecto --title --description --keywords a,b)
  dc-skills request <nombre> ["motivo"]   Registra un skill que hace falta
  dc-skills requests             Lista los skills pedidos pendientes
  dc-skills import <owner/repo> [skills...] [--list] [--all] [--as nombre] [--category x] [--exclude 'test/,*.html']
                                 Copia skills de un repo de terceros con LICENSE y créditos
  dc-skills import --update      Re-descarga los skills importados desde su repo original
  dc-skills credits              Regenera CREDITS.md del catálogo
  dc-skills catalog [add <ruta> --name x | remove x]   Catálogos (público, privados, local)

${c.bold('Privacidad')}
  dc-skills guard [--staged]     Busca términos privados y secretos en el repo actual
  dc-skills guard --add a,b      Agrega términos privados (se guardan fuera de cualquier repo)
  dc-skills guard --allow <ruta> Acepta un archivo ya revisado (glob, p. ej. skills/x/data/*.json)
  dc-skills guard --install-hook Hook pre-commit que bloquea filtraciones

${c.bold('Memoria compartida')} ${c.dim('(todas usan --agent <nombre> o la variable DC_AGENT)')}
  dc-skills mem add "texto" [--kind decision|note|bug|todo|convention] [--tags a,b] [--global]
  dc-skills mem search "consulta" [--all] [--limit 20]
  dc-skills mem list [--limit 20]
  dc-skills mem forget <id>
  dc-skills log "mensaje" [--type log]

${c.bold('Servicios')}
  dc-skills serve [--port 47821] [--open]   Dashboard local de memoria y logs (botón para apagar)
  dc-skills mcp                              Servidor MCP (stdio) para agentes compatibles con MCP

${c.bold('Mantenimiento')}
  dc-skills doctor               Diagnóstico de instalación
  dc-skills self-update          Actualiza dc-skills (git pull)

Opciones globales: --dir <ruta> (otro proyecto), --json (salida JSON)
`;

const memory = () => import('./memory.js');

function context(flags) {
  const root = findProjectRoot(flags.dir ? path.resolve(flags.dir) : process.cwd());
  return {
    root,
    name: path.basename(root),
    id: projectId(root),
    agent: flags.agent || process.env.DC_AGENT || 'unknown',
  };
}

const list = (value) => (typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function track(ctx, type, message, data) {
  try {
    (await memory()).logEvent({ project: ctx.id, projectName: ctx.name, agent: ctx.agent, type, message, data });
  } catch {
    // Logging must never break a command.
  }
}

// ───────────────────────────── skills ─────────────────────────────

function cmdList(flags) {
  const catalog = loadCatalog();
  if (flags.json) return printJson(catalog.map(({ dir, detect, ...s }) => s));
  console.log(c.bold(`\nCatálogo (${catalog.length} skills)\n`));
  let category = '';
  for (const s of catalog) {
    if (s.category !== category) {
      category = s.category;
      console.log(c.magenta(`  ${category.toUpperCase()}`));
    }
    const extra = [
      s.requires.length ? `requiere: ${s.requires.join(', ')}` : '',
      s.origin ? `de ${s.origin.repo} · ${s.origin.license}` : '',
      s.source === 'local' ? 'local' : '',
    ]
      .filter(Boolean)
      .join(' · ');
    console.log(`    ${c.cyan(s.name.padEnd(16))} ${s.description}${extra ? c.dim(`  (${extra})`) : ''}`);
  }
  console.log();
}

function cmdInstalled(flags) {
  const ctx = context(flags);
  const manifest = readManifest(ctx.root);
  if (flags.json) return printJson({ project: ctx.root, ...manifest });
  console.log(`\n${c.bold('Proyecto:')} ${ctx.root}`);
  if (!manifest.skills.length) return console.log(c.yellow('  Sin skills instalados. Usa `dc-skills` o `dc-skills add <skill>`.\n'));
  console.log(c.bold(`Instalados (${manifest.skills.length}):`), manifest.skills.map((s) => c.green(s)).join(', '));
  console.log(c.dim(`En: ${manifest.targets.join(', ')}\n`));
}

function cmdRecommend(flags) {
  const ctx = context(flags);
  const description = flags._.slice(1).join(' ');
  const ranked = recommend(loadCatalog(), scanProject(ctx.root), description);
  if (flags.json) return printJson(ranked.map((r) => ({ name: r.skill.name, score: r.score, reasons: r.reasons })));
  if (!ranked.length) return console.log(c.yellow('Sin coincidencias. Describe el proyecto: dc-skills recommend "api en nest con postgres"'));
  console.log(c.bold('\nRecomendación del orquestador:\n'));
  for (const r of ranked) console.log(`  ${c.green(r.skill.name.padEnd(16))} ${c.dim(`puntaje ${String(r.score).padStart(3)}`)}  ${r.reasons.join(', ')}`);
  console.log(c.dim(`\nInstalar: dc-skills add ${ranked.map((r) => r.skill.name).join(' ')} --yes\n`));
}

async function cmdAdd(flags) {
  const ctx = context(flags);
  const names = [...flags._.slice(1).map((n) => n.toLowerCase()), ...skillsFromPacks(list(flags.pack))];
  if (!names.length) throw new Error('Indica qué instalar: dc-skills add laravel filament · dc-skills add --pack calidad');
  const catalog = loadCatalog();
  if (!flags.yes && isInteractive() && !(await confirm(`¿Instalar ${names.join(', ')} (más sus requisitos) en ${ctx.root}?`, true))) return;
  const installed = installSkills(ctx.root, names, catalog);
  await track(ctx, 'install', `Skills instalados: ${installed.join(', ')}`, { skills: installed });
  if (flags.json) return printJson({ installed });
  console.log(c.green(`✔ Instalados: ${installed.join(', ')}`));
  console.log(c.dim('  AGENTS.md actualizado. Los agentes los verán al iniciar la sesión.'));
}

function cmdPacks(flags) {
  const packs = loadPacks();
  const installed = readManifest(context(flags).root).skills;
  if (flags.json) return printJson(packs);
  console.log(c.bold('\nPacks de skills'), c.dim('(dc-skills add --pack <nombre>)\n'));
  for (const [name, pack] of Object.entries(packs)) {
    const missing = pack.skills.filter((s) => !installed.includes(s));
    const state = missing.length ? c.dim(`${pack.skills.length - missing.length}/${pack.skills.length} instalados`) : c.green('completo');
    console.log(`  ${c.cyan(name.padEnd(20))} ${pack.description}${pack.private ? c.yellow(' [privado]') : ''}`);
    console.log(`  ${''.padEnd(20)} ${c.dim(pack.skills.join(', '))} · ${state}`);
  }
  console.log();
}

async function packFlow(ctx) {
  const packs = Object.entries(loadPacks());
  const picked = await multiSelect(packs.map(([name, p]) => ({ name, label: `${name.padEnd(20)} ${c.dim(p.description)}` })));
  if (!picked.length) return;
  const installed = installSkills(ctx.root, skillsFromPacks(picked), loadCatalog());
  await track(ctx, 'install', `Packs instalados: ${picked.join(', ')}`, { packs: picked, skills: installed });
  console.log(c.green(`\n✔ Packs ${picked.join(', ')}: ${installed.join(', ')}`));
}

async function cmdRemove(flags) {
  const ctx = context(flags);
  const names = flags._.slice(1);
  if (!names.length) throw new Error('Indica qué skills quitar: dc-skills remove angular');
  removeSkills(ctx.root, names, loadCatalog());
  await track(ctx, 'remove', `Skills quitados: ${names.join(', ')}`, { skills: names });
  console.log(c.green(`✔ Quitados: ${names.join(', ')}`));
}

async function cmdUpdate(flags) {
  const ctx = context(flags);
  const { updated, missing } = updateSkills(ctx.root, loadCatalog());
  await track(ctx, 'update', `Skills actualizados: ${updated.join(', ')}`);
  console.log(c.green(`✔ Actualizados: ${updated.join(', ') || '(ninguno)'}`));
  if (missing.length) console.log(c.yellow(`  No están en el catálogo: ${missing.join(', ')}`));
}

function cmdInit(flags) {
  const ctx = context(flags);
  initProject(ctx.root, loadCatalog());
  console.log(c.green(`✔ Proyecto preparado en ${ctx.root}`));
  console.log(c.dim('  AGENTS.md, CLAUDE.md, GEMINI.md y dc-skills.json listos. Abre tu agente y dile "empecemos".'));
}

async function cmdAgentStart(flags) {
  const ctx = context(flags);
  const { buildStatus } = await import('./report.js');
  await track(ctx, 'session_start', `Sesión iniciada (${ctx.agent})`);
  console.log(buildStatus(ctx.root, { description: flags._.slice(1).join(' ') }));
}

async function cmdNew(flags) {
  const ctx = context(flags);
  const { createSkill } = await import('./scaffold.js');
  let name = flags._[1];
  if (!name && isInteractive()) name = await ask('Nombre del skill (ej. vue, laravel-livewire): ');
  if (!name) throw new Error('Uso: dc-skills new <nombre> --description "..." --keywords a,b');
  let { title, description } = flags;
  let keywords = list(flags.keywords);
  if (isInteractive() && !flags.yes) {
    title ||= (await ask(`Título visible ${c.dim(`(${name})`)}: `)) || name;
    description ||= await ask('Descripción (qué cubre y cuándo usarlo): ');
    if (!keywords.length) keywords = list(await ask(`Palabras clave para detectarlo ${c.dim('(coma)')}: `));
  }
  // --scope: publico (repo dc-skills) · <catálogo privado> · local (~/.dc-skills) · proyecto (solo este proyecto)
  const scope = flags.scope || null;
  const catalogDir = scope === 'proyecto' ? path.join(ctx.root, '.agents', 'skills') : catalogDirForScope(scope);
  const dir = createSkill({
    name: name.toLowerCase(),
    title,
    description,
    keywords,
    requires: list(flags.requires),
    category: flags.category || 'other',
    files: list(flags.files),
    npm: list(flags.npm),
    composer: list(flags.composer),
    catalogDir,
  });
  if (scope === 'proyecto') syncAgentsFile(ctx.root, readManifest(ctx.root), loadCatalog());
  (await memory()).setSkillRequestStatus(name.toLowerCase(), 'done');
  await track(ctx, 'skill_created', `Skill creado: ${name}`, { dir, scope });
  console.log(c.green(`✔ Skill creado en ${dir}`));
  console.log(c.dim('  Completa SKILL.md siguiendo el skill skill-creator (o pídeselo a tu agente).'));
  if (path.dirname(dir) === path.join(ROOT, 'skills')) console.log(c.yellow('  Catálogo PÚBLICO: revisa que no tenga nada interno antes de commit/push (dc-skills guard).'));
}

function cmdCatalog(flags) {
  const [, action, target] = flags._;
  const config = readConfig();
  if (action === 'add') {
    if (!target) throw new Error('Uso: dc-skills catalog add <ruta-a-carpeta-skills> --name interno');
    const dir = path.resolve(target);
    const name = (flags.name || path.basename(path.dirname(dir)) || 'interno').toLowerCase();
    if (['publico', 'local', 'proyecto'].includes(name)) throw new Error(`"${name}" es un nombre reservado; usa --name <otro>.`);
    const rel = path.relative(ROOT, dir);
    if (!rel || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
      throw new Error('Un catálogo privado no puede estar dentro del repo público dc-skills.');
    }
    fs.mkdirSync(dir, { recursive: true });
    config.catalogs = [...config.catalogs.filter((x) => x.name !== name), { name, path: dir }];
    writeConfig(config);
    return console.log(c.green(`✔ Catálogo privado "${name}" → ${dir}`), c.dim(`(config en ${CONFIG_PATH})`));
  }
  if (action === 'remove') {
    config.catalogs = config.catalogs.filter((x) => x.name !== target);
    writeConfig(config);
    return console.log(c.green(`✔ Catálogo "${target}" quitado (los archivos no se borran)`));
  }
  console.log(c.bold('\nCatálogos de skills\n'));
  for (const { dir, source, name } of CATALOG_DIRS) {
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'SKILL.md'))).length : 0;
    console.log(`  ${c.cyan(name.padEnd(10))} ${(source === 'private' ? c.yellow : c.dim)(source.padEnd(8))} ${String(count).padStart(3)} skills  ${c.dim(dir)}`);
  }
  console.log(c.dim(`\n  Agregar uno privado: dc-skills catalog add <ruta> --name interno\n`));
}

async function cmdGuard(flags) {
  const { runGuard, installHook } = await import('./guard.js');
  if (flags['install-hook']) {
    const file = installHook(flags.dir ? path.resolve(flags.dir) : ROOT);
    return console.log(c.green(`✔ Hook pre-commit instalado en ${file}`));
  }
  const { findings, terms } = runGuard({ cwd: flags.dir ? path.resolve(flags.dir) : process.cwd(), staged: Boolean(flags.staged) });
  if (!terms) console.log(c.yellow('  (sin términos privados configurados; solo se buscan claves y tokens. Agrega con: dc-skills guard --add <término>)'));
  if (!findings.length) return console.log(c.green('✔ Sin términos privados ni secretos.'));
  console.log(c.red(`✖ ${findings.length} posible(s) filtración(es):`));
  for (const f of findings) console.log(`  ${c.cyan(`${f.file}:${f.line}`)} ${c.yellow(f.reason)}`);
  process.exitCode = 1;
}

function cmdGuardTerms(flags) {
  const config = readConfig();
  if (flags.allow) {
    config.guardAllow = [...new Set([...(config.guardAllow || []), ...list(flags.allow)])];
    writeConfig(config);
    return console.log(c.green(`✔ Excepciones revisadas: ${config.guardAllow.join(', ')}`), c.dim(`(en ${CONFIG_PATH})`));
  }
  config.privateTerms = [...new Set([...config.privateTerms, ...list(flags.add)])];
  writeConfig(config);
  console.log(c.green(`✔ ${config.privateTerms.length} término(s) privado(s) en ${CONFIG_PATH} (fuera de cualquier repo)`));
}

async function cmdRequest(flags) {
  const ctx = context(flags);
  const name = flags._[1]?.toLowerCase();
  if (!name) throw new Error('Uso: dc-skills request <nombre> "motivo"');
  const id = (await memory()).addSkillRequest({ name, reason: flags._.slice(2).join(' ') || null, project: ctx.id, agent: ctx.agent });
  await track(ctx, 'skill_request', `Skill solicitado: ${name}`);
  console.log(c.green(`✔ Solicitud #${id} registrada: ${name}.`), c.dim(`Créalo con: dc-skills new ${name}`));
}

async function cmdRequests(flags) {
  const rows = (await memory()).listSkillRequests({ status: flags.all ? null : 'pending' });
  if (flags.json) return printJson(rows);
  if (!rows.length) return console.log(c.dim('No hay skills pendientes de crear.'));
  for (const r of rows) console.log(`  ${c.cyan(`#${r.id}`)} ${c.bold(r.name)} ${c.dim(r.status)} ${r.reason || ''}`);
}

async function cmdImport(flags) {
  const ctx = context(flags);
  const imp = await import('./importer.js');

  if (flags.update) {
    const imported = loadCatalog().filter((s) => s.origin);
    if (!imported.length) return console.log(c.dim('No hay skills importados que actualizar.'));
    for (const s of imported) {
      const repo = imp.parseRepo(`${s.origin.repoUrl}${s.origin.ref ? `@${s.origin.ref}` : ''}`);
      const checkout = imp.fetchRepo(repo);
      const skill = imp.scanRepoSkills(checkout.dir).find((x) => x.relPath === s.origin.path);
      if (!skill) {
        console.log(c.yellow(`  · ${s.name}: ya no existe ${s.origin.path} en ${repo.slug}`));
        continue;
      }
      imp.importSkill(skill, { repo, checkout, as: s.name, exclude: s.origin.exclude || [] });
      console.log(c.green(`  ✔ ${s.name}`), c.dim(`${repo.slug}@${checkout.commit.slice(0, 7)}`));
    }
    imp.writeCatalogCredits();
    return;
  }

  const [, source, ...wanted] = flags._;
  if (!source) throw new Error('Uso: dc-skills import <owner/repo | url>[@rama] [skills...] [--list] [--all] [--as nombre]');
  const repo = imp.parseRepo(source);
  console.log(c.dim(`Descargando ${repo.url} ...`));
  const checkout = imp.fetchRepo(repo);
  const found = imp.scanRepoSkills(checkout.dir);
  if (!found.length) throw new Error(`No se encontraron carpetas con SKILL.md en ${repo.slug}.`);

  const okLicense = (s) => imp.PERMISSIVE.has(s.license);
  const label = (s) =>
    `${s.name.padEnd(34)} ${(okLicense(s) ? c.green : c.red)(s.license.padEnd(11))} ${c.dim(s.description.slice(0, 70))}`;

  if (flags.list) {
    if (flags.json) return printJson(found.map(({ dir, licenseFile, ...s }) => s));
    console.log(c.bold(`\n${repo.slug} · ${found.length} skills`), c.dim(`(commit ${checkout.commit.slice(0, 7)})\n`));
    for (const s of found) console.log(`  ${label(s)}`);
    console.log(c.dim(`\n  En rojo: no se pueden copiar por su licencia.\n  Importar: dc-skills import ${repo.slug} <skill> [<skill>...]\n`));
    return;
  }

  let selected;
  if (flags.all) selected = found.filter(okLicense);
  else if (wanted.length) {
    selected = wanted.map((w) => {
      const hit = found.find((s) => s.name === w || s.relPath === w || s.relPath.endsWith(`/${w}`));
      if (!hit) throw new Error(`"${w}" no está en ${repo.slug}. Mira la lista con --list.`);
      return hit;
    });
  } else if (isInteractive()) {
    console.log(c.bold(`\n${repo.slug} · elige qué importar\n`));
    const names = await multiSelect(found.map((s) => ({ name: s.name, label: label(s) })));
    selected = found.filter((s) => names.includes(s.name));
  } else {
    throw new Error('Indica los skills a importar, --all, o usa --list para verlos.');
  }
  if (flags.as && selected.length !== 1) throw new Error('--as solo se puede usar importando un skill a la vez.');

  const done = [];
  for (const skill of selected) {
    try {
      imp.importSkill(skill, { repo, checkout, as: flags.as, category: flags.category, allowAnyLicense: Boolean(flags['allow-any-license']), exclude: list(flags.exclude) });
      done.push(flags.as || skill.name);
      console.log(c.green(`  ✔ ${flags.as || skill.name}`), c.dim(`${skill.license}${skill.authors ? ` · ${skill.authors}` : ''}`));
    } catch (err) {
      console.log(c.red(`  ✖ ${err.message}`));
    }
  }
  if (!done.length) return;
  const { file } = imp.writeCatalogCredits();
  await track(ctx, 'skill_import', `Importados de ${repo.slug}: ${done.join(', ')}`, { repo: repo.slug, commit: checkout.commit });
  console.log(c.dim(`\n  Créditos en cada skill (CREDITS.md + LICENSE) y en ${file}`));
  console.log(c.dim('  Revisa los SKILL.md antes de compartirlos; ajusta dc.json (category, keywords) para que el orquestador los recomiende.'));
}

async function cmdCredits() {
  const { writeCatalogCredits } = await import('./importer.js');
  const { file, count } = writeCatalogCredits();
  console.log(c.green(`✔ ${file} actualizado (${count} skills de terceros)`));
}

// ───────────────────────────── memory ─────────────────────────────

function printMemories(rows) {
  if (!rows.length) return console.log(c.dim('  (sin resultados)'));
  for (const m of rows) {
    const where = m.project ? m.project_name : 'global';
    console.log(`  ${c.cyan(`#${m.id}`)} ${c.dim(`${m.created_at.slice(0, 16).replace('T', ' ')} · ${m.agent} · ${m.kind} · ${where}`)}`);
    console.log(`     ${m.content}${m.tags ? c.dim(`  [${m.tags}]`) : ''}`);
  }
}

async function cmdMem(flags) {
  const ctx = context(flags);
  const mem = await memory();
  const [, action, ...rest] = flags._;
  const limit = Number(flags.limit) || 20;
  switch (action) {
    case 'add': {
      const content = rest.join(' ');
      const id = mem.addMemory({
        project: flags.global ? null : ctx.id,
        projectName: flags.global ? null : ctx.name,
        agent: ctx.agent,
        kind: flags.kind || 'note',
        content,
        tags: list(flags.tags).join(','),
      });
      return flags.json ? printJson({ id }) : console.log(c.green(`✔ Memoria #${id} guardada`));
    }
    case 'search': {
      const rows = mem.searchMemories({ query: rest.join(' '), project: flags.all ? null : ctx.id, limit });
      return flags.json ? printJson(rows) : printMemories(rows);
    }
    case 'list':
    case undefined: {
      const rows = mem.recentMemories({ project: flags.all ? null : ctx.id, limit });
      return flags.json ? printJson(rows) : printMemories(rows);
    }
    case 'forget':
    case 'delete': {
      const ok = mem.deleteMemory(Number(rest[0]));
      return console.log(ok ? c.green(`✔ Memoria #${rest[0]} eliminada`) : c.yellow('No existe esa memoria'));
    }
    default:
      throw new Error(`Acción desconocida "${action}". Usa: add | search | list | forget`);
  }
}

async function cmdLog(flags) {
  const ctx = context(flags);
  const message = flags._.slice(1).join(' ');
  if (!message) throw new Error('Uso: dc-skills log "mensaje"');
  (await memory()).logEvent({ project: ctx.id, projectName: ctx.name, agent: ctx.agent, type: flags.type || 'log', message });
  if (!flags.quiet) console.log(c.green('✔ Log registrado'));
}

// ───────────────────────────── services ─────────────────────────────

async function cmdServe(flags) {
  const { startServer } = await import('./server.js');
  await startServer({ port: Number(flags.port) || Number(process.env.DC_SKILLS_PORT) || 47821, open: Boolean(flags.open) });
}

async function cmdMcp(flags) {
  const { runMcp } = await import('./mcp.js');
  await runMcp(context(flags));
}

async function cmdDoctor() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const nodeOk = major > 22 || (major === 22 && minor >= 13);
  const line = (ok, label, detail) => console.log(`  ${ok ? c.green('✔') : c.red('✖')} ${label.padEnd(18)} ${c.dim(detail)}`);
  console.log(c.bold(`\ndc-skills v${PKG.version}\n`));
  line(nodeOk, 'Node.js', `${process.versions.node} ${nodeOk ? '' : '(se necesita >= 22.13)'}`);
  line(true, 'Paquete', ROOT + (IS_GIT_CHECKOUT ? ' (git)' : ''));
  for (const { dir, source } of CATALOG_DIRS) line(true, `Catálogo ${source}`, fs.existsSync(dir) ? dir : `${dir} (vacío)`);
  line(true, 'Skills nuevos en', writableCatalogDir());
  line(true, 'Skills', `${loadCatalog().length} en catálogo`);
  try {
    const s = (await memory()).stats();
    line(true, 'Memoria', `${DB_PATH} · ${s.memories} memorias · ${s.events} eventos`);
  } catch (err) {
    line(false, 'Memoria', err.message);
  }
  const ctx = context({});
  line(hasManifest(ctx.root), 'Proyecto actual', `${ctx.root}${hasManifest(ctx.root) ? '' : ' (sin dc-skills.json; usa dc-skills init)'}`);
  console.log(c.dim(`\n  Datos de usuario: ${HOME}\n`));
}

function cmdSelfUpdate() {
  if (!IS_GIT_CHECKOUT) {
    console.log('Instalado vía npm. Actualiza con:');
    console.log(c.cyan('  npm install -g github:danycabarcas/dc-skills'));
    return;
  }
  const result = spawnSync('git', ['-C', ROOT, 'pull', '--ff-only'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('git pull falló (¿cambios locales sin commit?).');
  console.log(c.green('✔ dc-skills actualizado.'), c.dim('En cada proyecto ejecuta `dc-skills update` para refrescar sus skills.'));
}

// ───────────────────────────── interactive ─────────────────────────────

async function installFlow(ctx) {
  const catalog = loadCatalog();
  const manifest = readManifest(ctx.root);
  const description = await ask(`\n${c.bold('Describe el proyecto')} ${c.dim('(stack, framework, panel, frontend... Enter para solo detectar)')}:\n> `);
  const ranked = recommend(catalog, scanProject(ctx.root), description);
  const recommended = ranked.map((r) => r.skill.name).filter((n) => !manifest.skills.includes(n));
  const reasons = new Map(ranked.map((r) => [r.skill.name, r.reasons.join(', ')]));
  const items = catalog.map((s) => ({
    name: s.name,
    label: `${s.name.padEnd(16)} ${c.dim(s.category.padEnd(9))} ${manifest.skills.includes(s.name) ? c.green('[instalado] ') : ''}${
      reasons.has(s.name) ? c.yellow(reasons.get(s.name)) : c.dim(s.description.slice(0, 70))
    }`,
  }));
  console.log(c.bold(`\nSkills disponibles ${c.green('★')} = recomendado\n`));
  const picked = await multiSelect(items, recommended);
  if (!picked.length) return console.log(c.dim('Nada que instalar.'));
  const installed = installSkills(ctx.root, picked, catalog);
  await track(ctx, 'install', `Skills instalados: ${installed.join(', ')}`, { skills: installed, description });
  console.log(c.green(`\n✔ Instalados: ${installed.join(', ')}`));
  console.log(c.dim('  AGENTS.md / CLAUDE.md / GEMINI.md actualizados.'));
}

async function removeFlow(ctx) {
  const manifest = readManifest(ctx.root);
  if (!manifest.skills.length) return console.log(c.dim('No hay skills instalados.'));
  const picked = await multiSelect(manifest.skills.map((name) => ({ name, label: name })));
  if (!picked.length) return;
  removeSkills(ctx.root, picked, loadCatalog());
  console.log(c.green(`✔ Quitados: ${picked.join(', ')}`));
}

async function memoryFlow(ctx) {
  const mem = await memory();
  const query = await ask(`Buscar en memoria ${c.dim('(Enter = recientes)')}: `);
  printMemories(query ? mem.searchMemories({ query, project: ctx.id }) : mem.recentMemories({ project: ctx.id, limit: 15 }));
}

async function interactive(flags) {
  const ctx = context(flags);
  console.log(`\n${c.bold(c.cyan('DC SKILLS'))} ${c.dim(`v${PKG.version}`)} · ${c.bold(ctx.name)} ${c.dim(ctx.root)}`);
  if (!hasManifest(ctx.root)) console.log(c.yellow('Proyecto nuevo para dc-skills: empecemos eligiendo skills.'));

  while (true) {
    const manifest = readManifest(ctx.root);
    console.log(`\n${c.dim('Instalados:')} ${manifest.skills.length ? manifest.skills.map(c.green).join(', ') : c.dim('ninguno')}\n`);
    const options = [
      ['Instalar / seleccionar skills', () => installFlow(ctx), 'install'],
      ['Instalar un pack (calidad, arquitectura, datos, web pública...)', () => packFlow(ctx), 'install'],
      ['Ver skills instalados', () => cmdInstalled(flags)],
      ['Ver catálogo completo', () => cmdList(flags)],
      ['Quitar skills', () => removeFlow(ctx)],
      ['Actualizar skills instalados', () => cmdUpdate(flags)],
      ['Memoria: recientes / buscar', () => memoryFlow(ctx)],
      ['Abrir dashboard de memoria y logs', () => cmdServe({ ...flags, open: true }), 'serve'],
      ['Crear un skill nuevo', () => cmdNew({ ...flags, _: ['new'] })],
      ['Skills pedidos pendientes', () => cmdRequests(flags)],
    ];
    options.forEach(([label], i) => console.log(`  ${c.cyan(String(i + 1).padStart(2))}) ${label}`));
    console.log(`  ${c.cyan(' 0')}) Salir`);
    const choice = Number(await ask(`\n${c.bold('Opción')}: `));
    if (!choice) return;
    const option = options[choice - 1];
    if (!option) continue;
    try {
      await option[1]();
    } catch (err) {
      console.log(c.red(`✖ ${err.message}`));
    }
    if (option[2] === 'serve') return; // the dashboard keeps the process alive until it is shut down
    if (option[2] === 'install' &&!(await confirm('\n¿Deseas hacer algo más?', true))) return;
  }
}

// ───────────────────────────── entry ─────────────────────────────

const COMMANDS = {
  init: cmdInit,
  'agent-start': cmdAgentStart,
  start: cmdAgentStart,
  status: cmdAgentStart,
  list: cmdList,
  catalog: cmdList,
  installed: cmdInstalled,
  packs: cmdPacks,
  recommend: cmdRecommend,
  detect: cmdRecommend,
  add: cmdAdd,
  install: cmdAdd,
  remove: cmdRemove,
  update: cmdUpdate,
  new: cmdNew,
  request: cmdRequest,
  requests: cmdRequests,
  import: cmdImport,
  credits: cmdCredits,
  catalog: cmdCatalog,
  guard: (flags) => (flags.add || flags.allow ? cmdGuardTerms(flags) : cmdGuard(flags)),
  mem: cmdMem,
  memory: cmdMem,
  log: cmdLog,
  serve: cmdServe,
  mcp: cmdMcp,
  doctor: cmdDoctor,
  'self-update': cmdSelfUpdate,
};

export async function main(argv) {
  const flags = parseArgs(argv);
  const command = flags._[0];
  if (flags.help || command === 'help') return console.log(HELP);
  if (command === '--version' || flags.version) return console.log(PKG.version);
  if (!command) return isInteractive() ? interactive(flags) : cmdAgentStart(flags);
  const handler = COMMANDS[command];
  if (!handler) throw new Error(`Comando desconocido "${command}". Usa: dc-skills help`);
  return handler(flags);
}
