import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildNative } from './build-native.mjs';

const APP_NAME = 'open-slide Dev';
const BUNDLE_ID = 'dev.open-slide.desktop.dev';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);

// macOS reads the Dock, menu bar, and app switcher identity from the bundle,
// even after app.setName(), so dev runs a renamed copy of Electron.app. The
// copy keeps the stock node_modules bundle and its signature untouched.
function prepareMacBundle() {
  const electronDir = path.dirname(require.resolve('electron/package.json'));
  const icon = path.join(root, 'build/icon-dev.icns');
  const hash = createHash('sha256')
    .update(electronDir)
    .update(process.arch)
    .update(fs.readFileSync(path.join(electronDir, 'package.json')))
    .update(fs.readFileSync(icon))
    .update(fs.readFileSync(import.meta.filename))
    .digest('hex')
    .slice(0, 16);

  const cache = path.join(root, 'node_modules/.cache/open-slide-dev', hash);
  const bundle = path.join(cache, `${APP_NAME}.app`);
  // Electron tells dev from packaged runs by the executable's name, so it stays.
  const executable = path.join(bundle, 'Contents/MacOS/Electron');
  if (fs.existsSync(path.join(cache, 'ready'))) return executable;

  fs.rmSync(path.dirname(cache), { recursive: true, force: true });
  fs.mkdirSync(cache, { recursive: true });
  execFileSync('ditto', [path.join(electronDir, 'dist/Electron.app'), bundle]);

  const plist = path.join(bundle, 'Contents/Info.plist');
  for (const key of ['CFBundleName', 'CFBundleDisplayName']) {
    execFileSync('plutil', ['-replace', key, '-string', APP_NAME, plist]);
  }
  execFileSync('plutil', ['-replace', 'CFBundleIdentifier', '-string', BUNDLE_ID, plist]);
  fs.copyFileSync(icon, path.join(bundle, 'Contents/Resources/electron.icns'));
  // Editing the bundle invalidates Electron's signature; an ad-hoc one restores it.
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', bundle]);
  fs.writeFileSync(path.join(cache, 'ready'), '');
  return executable;
}

buildNative();

const env = { ...process.env };
if (process.platform === 'darwin') env.ELECTRON_EXEC_PATH = prepareMacBundle();

const child = spawn('electron-vite', ['dev', ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
