import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CLI = '@posthog/cli@0.19.0';

if (!process.env.POSTHOG_CLI_API_KEY || !process.env.POSTHOG_CLI_PROJECT_ID) {
  console.log(
    'Skipping source map upload: POSTHOG_CLI_API_KEY or POSTHOG_CLI_PROJECT_ID is unset.',
  );
  process.exit(0);
}

const core = path.join(root, 'node_modules/@open-slide/core/package.json');
const { version } = JSON.parse(fs.readFileSync(core, 'utf8'));

execFileSync(
  'npx',
  [
    '-y',
    CLI,
    '--host',
    process.env.POSTHOG_CLI_HOST ?? 'https://us.posthog.com',
    'sourcemap',
    'process',
    '--directory',
    path.join(root, 'dist'),
    '--release-name',
    'open-slide-desktop',
    '--release-version',
    version,
    '--delete-after',
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
