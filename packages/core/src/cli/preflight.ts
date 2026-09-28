import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { detectPackageManager, type PackageManager } from '../vite/routes/update.ts';

const MIGRATION_URL = 'https://open-slide.dev/docs/migrate-to-v2';

// Plugins core passes to Vite that import from `vite` themselves. Each one
// resolves `vite` from its own install location, which is not necessarily
// the copy core resolves.
const VITE_CONSUMERS = ['@vitejs/plugin-react', '@tailwindcss/vite'];

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const;

const PROJECT_ROOT_MARKERS = [
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  '.git',
];

// `root` is the directory whose node_modules held the package; `dir` is its
// realpath, which under pnpm points into the .pnpm store.
type ResolvedPackage = { dir: string; root: string; version: string };

export type ViteMismatch = {
  consumer: string;
  coreVite: ResolvedPackage;
  consumerVite: ResolvedPackage;
};

export type ViteDeclaration = { file: string; field: (typeof DEPENDENCY_FIELDS)[number] };

function locatePackage(name: string, fromDir: string): ResolvedPackage | null {
  let dir = fromDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', name);
    const pkgPath = path.join(candidate, 'package.json');
    if (existsSync(pkgPath)) {
      let version = 'unknown';
      try {
        version =
          (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }).version ?? version;
      } catch {}
      return { dir: realpathSync(candidate), root: dir, version };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function findViteMismatch(coreDir: string): ViteMismatch | null {
  const coreVite = locatePackage('vite', coreDir);
  if (!coreVite) return null;
  for (const consumer of VITE_CONSUMERS) {
    const consumerPkg = locatePackage(consumer, coreDir);
    if (!consumerPkg) continue;
    const consumerVite = locatePackage('vite', consumerPkg.dir);
    if (!consumerVite || consumerVite.version === coreVite.version) continue;
    return { consumer, coreVite, consumerVite };
  }
  return null;
}

function declarationIn(dir: string): ViteDeclaration | null {
  const file = path.join(dir, 'package.json');
  if (!existsSync(file)) return null;
  try {
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    for (const field of DEPENDENCY_FIELDS) {
      const deps = pkg[field] as Record<string, unknown> | undefined;
      if (deps && Object.hasOwn(deps, 'vite')) return { file, field };
    }
  } catch {}
  return null;
}

function isProjectRoot(dir: string): boolean {
  return PROJECT_ROOT_MARKERS.some((marker) => existsSync(path.join(dir, marker)));
}

function isAncestorOrSelf(ancestor: string, dir: string): boolean {
  const rel = path.relative(ancestor, dir);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

// A direct dependency of the package that owns `installRoot/node_modules`
// always wins that slot, so check it first. Otherwise the shadowing copy was
// hoisted from a nested workspace package: take the nearest one above cwd.
// `installRoot` may sit below cwd (pnpm's .pnpm store), so it only bounds the
// walk when it is an ancestor; otherwise the project root does.
export function findViteDeclaration(cwd: string, installRoot?: string): ViteDeclaration | null {
  if (installRoot && (isAncestorOrSelf(installRoot, cwd) || isAncestorOrSelf(cwd, installRoot))) {
    const owner = declarationIn(installRoot);
    if (owner) return owner;
  }
  const stopAt = installRoot && isAncestorOrSelf(installRoot, cwd) ? installRoot : null;
  let dir = cwd;
  while (dir !== stopAt) {
    const found = declarationIn(dir);
    if (found) return found;
    const parent = path.dirname(dir);
    if (parent === dir || (!stopAt && isProjectRoot(dir))) return null;
    dir = parent;
  }
  return null;
}

function removeCommand(pm: PackageManager): string {
  return pm === 'npm' ? 'npm uninstall vite' : `${pm} remove vite`;
}

type FormatContext = {
  cwd?: string;
  packageManager?: PackageManager;
  declaration?: ViteDeclaration | null;
};

export function formatViteMismatch(
  mismatch: ViteMismatch,
  { cwd = process.cwd(), packageManager = 'npm', declaration = null }: FormatContext = {},
): string {
  const rel = (p: string) => path.relative(cwd, p) || p;
  const want = chalk.bold(`vite@${mismatch.coreVite.version}`);
  const got = chalk.bold(`vite@${mismatch.consumerVite.version}`);
  const from = chalk.dim(rel(mismatch.consumerVite.dir));
  const command = (cmd: string) => ['', `  ${chalk.dim('$')} ${chalk.cyan(cmd)}`, ''];
  const footer = `${chalk.dim('Migration guide')}  ${chalk.cyan.underline(MIGRATION_URL)}`;

  if (!declaration) {
    return [
      chalk.bold('Conflicting vite versions in node_modules'),
      '',
      `open-slide ships ${want}, but ${mismatch.consumer} is loading ${got}`,
      `from ${from}. Make sure no package.json lists vite, then reinstall:`,
      ...command(`${packageManager} install`),
      footer,
    ].join('\n');
  }

  const dir = path.dirname(declaration.file);
  const cd = path.resolve(dir) === path.resolve(cwd) ? '' : `cd ${rel(dir)} && `;
  return [
    chalk.bold(`Remove ${chalk.yellow('vite')} from your package.json`),
    '',
    `${chalk.bold(declaration.field)} in ${chalk.dim(rel(declaration.file))} still lists vite, a leftover from v1.`,
    `It shadows the ${want} bundled with open-slide: ${mismatch.consumer}`,
    `is loading ${got} from ${from} instead.`,
    ...command(cd + removeCommand(packageManager)),
    footer,
  ].join('\n');
}

export async function assertViteResolvesToCore(cwd = process.cwd()): Promise<void> {
  const coreDir = realpathSync(path.dirname(fileURLToPath(import.meta.url)));
  const mismatch = findViteMismatch(coreDir);
  if (!mismatch) return;
  const declaration = findViteDeclaration(cwd, mismatch.consumerVite.root);
  const packageManager = await detectPackageManager(
    declaration ? path.dirname(declaration.file) : cwd,
  );
  throw new Error(formatViteMismatch(mismatch, { cwd, packageManager, declaration }));
}
