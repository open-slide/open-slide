import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, fixtureDir, prepareScratchProject, runCli } from './helpers.ts';

test.describe('open-slide cli', () => {
  test('prints the package version', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(coreRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    const res = await runCli(['-v'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout.trim()).toBe(pkg.version);
  });

  test('lists commands in help output', async () => {
    const res = await runCli(['--help'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('Start the dev server');
    expect(res.stdout).toContain('Build a static site');
    expect(res.stdout).toContain('Export a deck');
    expect(res.stdout).toContain('Preview the production build');
  });

  test('rejects an invalid port', async () => {
    const res = await runCli(['dev', '-p', 'abc'], fixtureDir, 30_000);
    expect(res.code).toBe(1);
    expect(res.stderr).toContain('Invalid port: abc');
  });
});

test.describe('open-slide export', () => {
  for (const format of ['html', 'pdf', 'pptx', 'pptx-images'] as const) {
    test(`exports a deck as ${format}`, async () => {
      test.setTimeout(180_000);
      const outDir = test.info().outputPath('exports');
      const result = await runCli(
        ['export', '--slide', 'alpha', '--format', format, '--out-dir', outDir],
        fixtureDir,
      );
      expect(result.code, result.stderr).toBe(0);
      const files = await fs.readdir(outDir);
      expect(files).toHaveLength(1);
      const [filename] = files;
      const output = path.join(outDir, filename);
      expect(result.stdout.trim().split('\n').at(-1)).toBe(output);
      const bytes = await fs.readFile(output);
      if (format === 'html') {
        expect(filename).toMatch(/^alpha\.(html|zip)$/);
        const html =
          filename === 'alpha.zip'
            ? strFromU8(unzipSync(bytes)['alpha.html'])
            : bytes.toString('utf8');
        expect(html).toContain('Alpha page three');
      } else if (format === 'pdf') {
        expect(filename).toBe('alpha.pdf');
        expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
        expect(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(3);
      } else {
        expect(filename).toBe('alpha.pptx');
        const parts = unzipSync(bytes);
        const firstSlide = strFromU8(parts['ppt/slides/slide1.xml']);
        if (format === 'pptx') {
          expect(firstSlide).toContain('<a:t>Alpha page one</a:t>');
        } else {
          expect(firstSlide).toContain('<p:pic>');
          expect(Object.keys(parts).filter((file) => file.startsWith('ppt/media/'))).toHaveLength(
            3,
          );
        }
      }
    });
  }

  test('bundles slide assets with a configured base path', async () => {
    test.setTimeout(180_000);
    const project = prepareScratchProject('cli-export-assets');
    await fs.writeFile(
      path.join(project, 'open-slide.config.ts'),
      "export default { base: '/decks/', build: { allowHtmlDownload: false } };",
    );
    const slideDir = path.join(project, 'slides', 'with-assets');
    await fs.mkdir(slideDir);
    await fs.writeFile(
      path.join(slideDir, 'index.tsx'),
      'import image from "./art.svg?no-inline"; export default [() => <img src={image} alt="Test art" />];',
    );
    await fs.writeFile(
      path.join(slideDir, 'art.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="5"/></svg>',
    );

    const outDir = test.info().outputPath('exports');
    const result = await runCli(
      ['export', '--slide', 'with-assets', '--format', 'html', '--out-dir', outDir],
      project,
    );
    expect(result.code, result.stderr).toBe(0);
    const parts = unzipSync(await fs.readFile(path.join(outDir, 'with-assets.zip')));
    const image = strFromU8(parts['with-assets.html']).match(/<img[^>]+alt="Test art"[^>]*>/)?.[0];
    expect(image).toContain('src="assets/art.svg"');
    expect(strFromU8(parts['assets/art.svg'])).toContain('<circle');
  });

  test('fails for unknown decks without writing an export', async () => {
    test.setTimeout(90_000);
    const outDir = test.info().outputPath('exports');
    const result = await runCli(
      ['export', '--slide', 'absent', '--format', 'html', '--out-dir', outDir],
      fixtureDir,
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Slide not found: absent');
    await expect(fs.stat(outDir)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
