import readline from 'node:readline/promises';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (open, close) => (s) => (useColor ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));

export const c = {
  bold: paint(1, 22),
  dim: paint(2, 22),
  red: paint(31, 39),
  green: paint(32, 39),
  yellow: paint(33, 39),
  cyan: paint(36, 39),
  magenta: paint(35, 39),
};

export const isInteractive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function confirm(question, defaultYes = false) {
  const answer = (await ask(`${question} ${c.dim(defaultYes ? '(S/n)' : '(s/N)')} `)).toLowerCase();
  if (!answer) return defaultYes;
  return ['s', 'si', 'sí', 'y', 'yes'].includes(answer);
}

/**
 * Numbered multi-select. Accepts "1,3 5", skill names, "todos", Enter = preselected, "0" = cancel.
 * @param items [{ name, label }]
 */
export async function multiSelect(items, preselected = []) {
  items.forEach((item, i) => {
    const mark = preselected.includes(item.name) ? c.green('★') : ' ';
    console.log(`  ${mark} ${c.cyan(String(i + 1).padStart(2))}) ${item.label}`);
  });
  const hint = preselected.length ? `Enter = ${preselected.join(', ')}` : 'Enter = ninguno';
  const answer = await ask(`\n${c.bold('Elige')} números o nombres separados por coma ${c.dim(`(${hint} · "todos" · "0" cancelar)`)}: `);
  if (answer === '0') return [];
  if (!answer) return preselected;
  if (['todos', 'all', '*'].includes(answer.toLowerCase())) return items.map((i) => i.name);
  const picked = [];
  for (const token of answer.split(/[\s,]+/).filter(Boolean)) {
    const n = Number(token);
    const item = Number.isInteger(n) ? items[n - 1] : items.find((i) => i.name === token.toLowerCase());
    if (item) picked.push(item.name);
    else console.log(c.yellow(`  · Ignorado "${token}" (no está en la lista)`));
  }
  return [...new Set(picked)];
}

const BOOLEAN_FLAGS = new Set(['yes', 'json', 'open', 'global', 'all', 'help', 'force', 'quiet']);

/** `a b --port 1 --yes -y` → { _: ['a','b'], port: '1', yes: true } */
export function parseArgs(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-y') flags.yes = true;
    else if (arg === '-h') flags.help = true;
    else if (arg.startsWith('--')) {
      const [key, inline] = arg.slice(2).split(/=(.*)/s);
      if (inline !== undefined) flags[key] = inline;
      else if (BOOLEAN_FLAGS.has(key) || argv[i + 1] === undefined || argv[i + 1].startsWith('--')) flags[key] = true;
      else flags[key] = argv[++i];
    } else flags._.push(arg);
  }
  return flags;
}
