// Two guards for each package's documentation, run against the INSTALLED packages:
//   1. every name a package exports has a heading in its documentation, and every such heading is
//      a real export;
//   2. every `ts` code block is written out as a module, for the compiler to check next.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const generatedRoot = new URL('./src/generated/', import.meta.url);
rmSync(generatedRoot, { recursive: true, force: true });

for (const name of ['cube-solver', 'cube-scramble']) checkPackage(name);

function checkPackage(name) {
  const packageRoot = new URL(`./node_modules/@turnwise/${name}/`, import.meta.url);
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
    for (const exportName of match[1].split(',')) {
      const publicName = exportName.trim().split(/\s+as\s+/).pop();
      if (publicName) exported.add(publicName);
    }
  }

  const documented = new Set();
  for (const match of documentation.matchAll(/^### `(\w+)`/gm)) documented.add(match[1]);

  const undocumented = [...exported].filter((exportName) => !documented.has(exportName)).sort();
  const unknown = [...documented].filter((exportName) => !exported.has(exportName)).sort();
  if (exported.size === 0) throw new Error(`${name}: found no exports in dist/index.d.ts.`);
  if (undocumented.length > 0) {
    throw new Error(
      `${name}: exported but missing from docs/documentation.md: ${undocumented.join(', ')}`,
    );
  }
  if (unknown.length > 0) {
    throw new Error(`${name}: documented in docs/documentation.md but not exported: ${unknown.join(', ')}`);
  }

  // 2. Write every `ts` block to its own module. Blocks fenced as `ts signature` are skipped: they
  // show a declaration, not code that can run.
  const generated = new URL(`${name}/`, generatedRoot);
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
    const file = `docs-${String(count).padStart(2, '0')}.ts`;
    const header = `// From ${name} docs/documentation.md, line ${String(block.start)}. Generated; do not edit.\n`;
    writeFileSync(new URL(file, generated), `${header}${block.code.join('\n')}\nexport {};\n`);
    block = null;
  });
  if (block !== null) throw new Error(`${name}: unclosed code block at line ${String(block.start)}.`);
  if (count === 0) throw new Error(`${name}: found no \`ts\` code blocks in docs/documentation.md.`);

  console.log(
    `${name} documentation: ${String(exported.size)} exports all documented, ${String(count)} examples written for the compiler`,
  );
}
