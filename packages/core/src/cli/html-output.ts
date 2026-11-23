import { createHash } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { unzipSync } from 'fflate';

function assetInventory(names: string[]): string {
  const hash = createHash('sha256').update(JSON.stringify(names.sort())).digest('hex');
  return `<!-- open-slide-cli-assets:${hash} -->`;
}

async function canReplace(directory: string): Promise<boolean> {
  const entries = await readdir(directory, { withFileTypes: true });
  if (entries.length === 0) return true;
  if (
    entries.length !== 2 ||
    !entries.some((entry) => entry.name === 'index.html' && entry.isFile()) ||
    !entries.some((entry) => entry.name === 'assets' && entry.isDirectory())
  ) {
    return false;
  }

  const assets = await readdir(path.join(directory, 'assets'), { withFileTypes: true });
  const index = await readFile(path.join(directory, 'index.html'), 'utf8');
  return (
    assets.every((asset) => asset.isFile()) &&
    index.endsWith(`${assetInventory(assets.map((asset) => asset.name))}\n`)
  );
}

export async function saveHtmlOutput(
  staging: string,
  outDir: string,
  slide: string,
  downloadName: string,
  bytes: Uint8Array,
): Promise<string> {
  const htmlName = `${slide}.html`;
  const files = downloadName === htmlName ? { [htmlName]: bytes } : unzipSync(bytes);
  const html = files[htmlName];
  if (!html) throw new Error(`HTML export is missing ${htmlName}.`);

  const next = path.join(staging, 'deck');
  const assetsDir = path.join(next, 'assets');
  await mkdir(assetsDir, { recursive: true });
  const assets: string[] = [];
  for (const [entry, data] of Object.entries(files)) {
    if (entry === htmlName || entry === 'assets/') continue;
    const name = /^assets\/([^/\\:]+)$/.exec(entry)?.[1];
    if (!name || name === '.' || name === '..' || name.includes('\0')) {
      throw new Error(`Unexpected file in HTML export: ${entry}`);
    }
    await writeFile(path.join(assetsDir, name), data, { flag: 'wx' });
    assets.push(name);
  }
  await writeFile(
    path.join(next, 'index.html'),
    `${Buffer.from(html).toString('utf8')}\n${assetInventory(assets)}\n`,
  );

  const output = path.join(outDir, slide);
  const lock = `${output}.open-slide-lock`;
  const backup = path.join(lock, 'previous');
  await mkdir(lock);
  let keepBackup = false;
  try {
    const existing = await lstat(output).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (existing) {
      if (!existing.isDirectory() || !(await canReplace(output))) {
        throw new Error(
          `Cannot replace HTML export at ${output}. Choose a different output directory.`,
        );
      }
      await rename(output, backup);
    }
    try {
      await rename(next, output);
    } catch (error) {
      if (existing) {
        try {
          await rename(backup, output);
        } catch (cause) {
          keepBackup = true;
          throw new Error(
            `Could not restore the previous HTML export. Recover it from ${backup}.`,
            {
              cause,
            },
          );
        }
      }
      throw error;
    }
  } finally {
    if (!keepBackup) await rm(lock, { recursive: true, force: true });
  }
  return path.join(output, 'index.html');
}
