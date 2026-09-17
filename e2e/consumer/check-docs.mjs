// Two guards for the package documentation, run against the INSTALLED package:
//   1. every name the package exports has a heading in the documentation, and every such heading
//      is a real export;
//   2. every `ts` code block is written out as a module, for the compiler to check next.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const packageRoot = new URL('./node_modules/@turnwise/cube-solver/', import.meta.url);
const documentation = readFileSync(new URL('docs/documentation.md', packageRoot), 'utf8');
const declarations = readFileSync(new URL('dist/index.d.ts', packageRoot), 'utf8');

// 1. Exports and headings must match exactly.
const exported = new Set();
for (const match of declarations.matchAll(
  /^\s*export (?:declare )?(?:abstract )?(?:function|const|class|interface|type) (\w+)/gm,
)) {
  exported.add(match[1]);
}
for (const match of declarations.matchAll(/^\s*export (?:type )?\{([^}]*)\}/gm)) {
  for (const name of match[1].split(',')) {
    const publicName = name.trim().split(/\s+as\s+/).pop();
    if (publicName) exported.add(publicName);
  }
}

const documented = new Set();
for (const match of documentation.matchAll(/^### `(\w+)`/gm)) documented.add(match[1]);

const undocumented = [...exported].filter((name) => !documented.has(name)).sort();
const unknown = [...documented].filter((name) => !exported.has(name)).sort();
if (exported.size === 0) throw new Error('Found no exports in dist/index.d.ts.');
if (undocumented.length > 0) {
  throw new Error(`Exported but missing from docs/documentation.md: ${undocumented.join(', ')}`);
}
if (unknown.length > 0) {
  throw new Error(`Documented in docs/documentation.md but not exported: ${unknown.join(', ')}`);
}

// 2. Write every `ts` block to its own module. Blocks fenced as `ts signature` are skipped: they
// show a declaration, not code that can run.
const generated = new URL('./src/generated/', import.meta.url);
rmSync(generated, { recursive: true, force: true });
mkdirSync(generated, { recursive: true });

const lines = documentation.split('\n');
let block = null;
let count = 0;
lines.forEach((line, index) => {
  if (block === null) {
    if (line === '```ts') block = { start: index + 1, code: [] };
    return;
  }
  if (line !== '```') {
    block.code.push(line);
    return;
  }
  count += 1;
  const name = `docs-${String(count).padStart(2, '0')}.ts`;
  const header = `// From docs/documentation.md, line ${String(block.start)}. Generated; do not edit.\n`;
  writeFileSync(new URL(name, generated), `${header}${block.code.join('\n')}\nexport {};\n`);
  block = null;
});
if (block !== null) throw new Error(`Unclosed code block at line ${String(block.start)}.`);
if (count === 0) throw new Error('Found no `ts` code blocks in docs/documentation.md.');

console.log(
  `documentation: ${String(exported.size)} exports all documented, ${String(count)} examples written for the compiler`,
);
