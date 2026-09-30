/**
 * Copies the desktop components the homepage demo renders, plus everything they
 * import relatively, from ../uncached-desktop/src into src/demo/app.
 *
 * Usage: node scripts/sync-demo.mjs [path/to/uncached-desktop]
 *
 * The copy is committed: the site builds from its own repository, where the
 * desktop sources do not exist.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const desktopSrc = resolve(process.argv[2] ?? join(siteRoot, '..', 'uncached-desktop'), 'src');
const target = join(siteRoot, 'src', 'demo', 'app');

const ENTRIES = [
  'components/workspace/WorkspaceMap.tsx',
  'components/workspace/ProjectPage.tsx',
  'components/findings/FindingsSection.tsx',
  'components/completion/CompletionView.tsx',
  'components/layout/ModuleBar.tsx',
  'components/shared/ChoiceRow.tsx',
  'modules/dependencies/ProjectDependencyGroup.tsx',
  'modules/dependencies/ToolchainSection.tsx',
  'modules/maintenance/PolicyCard.tsx',
  'modules/maintenance/Selection.tsx',
  'modules/insights/Highlights.tsx',
  'modules/insights/Portrait.tsx',
  'modules/insights/Summary.tsx',
  'modules/insights/Timeline.tsx',
  'utils/insights.mjs',
  'utils/portrait.mjs',
  'utils/report.mjs',
  'types/maintenance.ts',
  'types/dependencies.ts',
  'types/duplicates.ts',
  'types/hygiene.ts',
  'types/module.ts',
  'types/toolchains.ts',
  'types/scan.ts',
  'types/workspace.ts',
  'i18n/locales/en/dependencies.json',
  'i18n/locales/en/findings.json',
  'i18n/locales/en/insights.json',
  'i18n/locales/en/maintenance.json',
  'i18n/locales/en/modules.json',
  'i18n/locales/en/shell.json',
  'i18n/locales/en/workspace.json',
];

/** Files whose runtime is replaced by the demo; their imports are not followed. */
const REPLACED = new Set(['i18n/index.ts', 'i18n/native.ts']);

const SPECIFIER = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const EXTENSIONS = ['', '.ts', '.tsx', '.mjs', '.js', '.json', '/index.ts', '/index.tsx'];

function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}

function resolveImport(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  return EXTENSIONS.map((extension) => base + extension).find(isFile) ?? null;
}

/** `.mjs` modules ship their types beside them as `.d.mts`. */
function declarationOf(file) {
  const declaration = file.replace(/\.mjs$/, '.d.mts');
  return declaration !== file && existsSync(declaration) ? declaration : null;
}

function collect() {
  const seen = new Set();
  const external = new Set();
  const queue = ENTRIES.map((entry) => join(desktopSrc, entry));

  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);

    const declaration = declarationOf(file);
    if (declaration) queue.push(declaration);

    if (file.endsWith('.json') || REPLACED.has(relative(desktopSrc, file))) continue;

    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(SPECIFIER)) {
      const specifier = match[1] ?? match[2];
      if (!specifier.startsWith('.')) {
        external.add(specifier);
        continue;
      }
      const resolved = resolveImport(file, specifier);
      if (!resolved) throw new Error(`${relative(desktopSrc, file)}: cannot resolve ${specifier}`);
      if (!resolved.startsWith(desktopSrc)) throw new Error(`${specifier} leaves src/`);
      queue.push(resolved);
    }
  }

  return { files: [...seen].sort(), external: [...external].sort() };
}

if (!existsSync(desktopSrc)) {
  console.error(`desktop sources not found at ${desktopSrc}`);
  process.exit(1);
}

const { files, external } = collect();
rmSync(target, { recursive: true, force: true });

for (const file of files) {
  const destination = join(target, relative(desktopSrc, file));
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(file, destination);
}

writeFileSync(
  join(target, 'SYNCED.md'),
  '# Copied from uncached-desktop/src by scripts/sync-demo.mjs. Edit the desktop sources, then re-run the script.\n',
);

console.log(`copied ${files.length} files into ${relative(siteRoot, target)}`);
console.log(`bare imports: ${external.join(', ')}`);
