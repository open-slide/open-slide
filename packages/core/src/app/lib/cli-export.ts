export const EXPORT_FORMATS = ['html', 'pdf', 'pptx', 'pptx-images'] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

declare global {
  interface Window {
    openSlideCliExport?: (format: ExportFormat) => Promise<void>;
    openSlideCliSavePdf?: () => Promise<boolean>;
  }
}
