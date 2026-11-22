import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app, type BrowserWindow, dialog, type WebContents } from 'electron';
import { track } from './telemetry';

let lastDir: string | null = null;

export async function exportPdf(
  page: WebContents,
  parent: BrowserWindow | null,
  filename: unknown,
): Promise<boolean> {
  if (!parent) throw new Error('Rejected host:print-to-pdf from an unknown sender');
  const name = typeof filename === 'string' ? filename.replace(/[/\\:*?"<>|]/g, '-').trim() : '';
  // Printed before the dialog, while the print document the page prepared is still in place.
  const pdf = await page.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  const { canceled, filePath } = await dialog.showSaveDialog(parent, {
    defaultPath: path.join(lastDir ?? app.getPath('downloads'), name || 'slides.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return false;
  lastDir = path.dirname(filePath);
  await writeFile(filePath, pdf);
  track('pdf_exported');
  return true;
}
