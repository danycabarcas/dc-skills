#!/usr/bin/env node
// Node 22 marks node:sqlite as experimental and prints a warning; silence only that one
// so the CLI output (and the MCP stdio channel) stays clean.
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) => {
  if (String(warning?.message ?? warning).includes('SQLite')) return;
  return emitWarning.call(process, warning, ...rest);
};

const { main } = await import('../src/cli.js');

main(process.argv.slice(2)).catch((err) => {
  console.error(`✖ ${err.message}`);
  if (process.env.DC_DEBUG) console.error(err.stack);
  process.exit(1);
});
