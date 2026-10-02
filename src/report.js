// Markdown status meant to be read by an agent at the start of a session
// (`dc-skills agent-start` and the MCP tool `skills_status` print the same thing).
import path from 'node:path';
import { projectId } from './paths.js';
import { loadCatalog } from './skills.js';
import { scanProject, recommend } from './detect.js';
import { readManifest, hasManifest } from './install.js';
import { recentMemories, listSkillRequests } from './memory.js';

export function buildStatus(root, { description = '', memoryLimit = 10 } = {}) {
  const catalog = loadCatalog();
  const manifest = readManifest(root);
  const base = manifest.targets.includes('.agents/skills') ? '.agents/skills' : manifest.targets[0];
  const byName = new Map(catalog.map((s) => [s.name, s]));
  const out = [];

  out.push(`# DC Skills · ${path.basename(root)}`, '', `Proyecto: \`${root}\``, '');

  if (manifest.skills.length) {
    out.push('## Skills instalados (léelos antes de escribir código)', '');
    for (const name of manifest.skills) {
      out.push(`- **${name}** → \`${base}/${name}/SKILL.md\` — ${byName.get(name)?.description || ''}`);
    }
    out.push('');
  } else {
    out.push(
      '## Primer arranque: aún no hay skills',
      '',
      'Haz esto antes de escribir código:',
      '1. Si el usuario no lo ha dicho, pregúntale en 1-2 frases qué va a construir (stack, si usa framework, panel admin, frontend...).',
      '2. Ejecuta `dc-skills recommend "<descripción del usuario>"` para obtener la recomendación del orquestador.',
      '3. Muéstrale la recomendación y el catálogo (abajo); pregúntale cuáles instalar. Recomienda, no decidas solo.',
      '4. Instala lo elegido: `dc-skills add <skill1> <skill2> --yes` (los requisitos se agregan solos).',
      '5. Lee los SKILL.md instalados y continúa.',
      '',
    );
  }

  const ranked = recommend(catalog, scanProject(root), description).filter((r) => !manifest.skills.includes(r.skill.name));
  if (ranked.length) {
    out.push(manifest.skills.length ? '## Sugeridos adicionales (detectados)' : '## Recomendación del orquestador', '');
    for (const r of ranked) out.push(`- **${r.skill.name}** (puntaje ${r.score}): ${r.reasons.join(', ')}`);
    out.push('');
  }

  if (!manifest.skills.length) {
    out.push('## Catálogo disponible', '');
    for (const s of catalog) out.push(`- **${s.name}** [${s.category}] — ${s.description}`);
    out.push('');
  }

  try {
    const memories = recentMemories({ project: projectId(root), limit: memoryLimit });
    out.push('## Memoria reciente del proyecto', '');
    if (memories.length) {
      for (const m of memories) {
        const scope = m.project ? '' : ' · global';
        out.push(`- [#${m.id} ${m.kind} · ${m.agent} · ${m.created_at.slice(0, 10)}${scope}] ${m.content}`);
      }
    } else {
      out.push('_Sin memorias todavía. Guarda decisiones con `dc-skills mem add`._');
    }
    out.push('');
    const requests = listSkillRequests();
    if (requests.length) {
      out.push('## Skills solicitados pendientes de crear', '');
      for (const r of requests) out.push(`- ${r.name}${r.reason ? ` — ${r.reason}` : ''}`);
      out.push('');
    }
  } catch (err) {
    out.push(`> Memoria no disponible: ${err.message}`, '');
  }

  out.push(
    '## Protocolo de memoria',
    '',
    '- Buscar antes de resolver: `dc-skills mem search "<tema>"`',
    '- Guardar decisiones/convenciones/bugs: `dc-skills mem add "<texto>" --agent <tu-nombre> --kind decision`',
    '- Registrar hitos: `dc-skills log "<qué hiciste>" --agent <tu-nombre>`',
    '- Falta un skill: `dc-skills request <nombre> "<motivo>"`; para crearlo sigue el skill `skill-creator`.',
  );
  if (!hasManifest(root)) out.push('', '> Este proyecto aún no tiene `dc-skills.json`; se creará al instalar el primer skill.');
  return out.join('\n');
}
