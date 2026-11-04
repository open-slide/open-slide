import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'native/haptics.m');
const output = path.join(root, 'dist/native/haptics.node');

export function buildNative() {
  if (process.platform !== 'darwin') return;
  if (fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(source).mtimeMs) return;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('xcrun', [
    'clang',
    '-bundle',
    '-undefined',
    'dynamic_lookup',
    '-fobjc-arc',
    '-O2',
    '-arch',
    'arm64',
    '-arch',
    'x86_64',
    '-mmacosx-version-min=11.0',
    '-framework',
    'AppKit',
    '-o',
    output,
    source,
  ]);
}

if (import.meta.filename === process.argv[1]) buildNative();
