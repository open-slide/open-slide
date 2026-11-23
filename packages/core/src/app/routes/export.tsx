import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { ExportFormat } from '../lib/cli-export';
import { useSlideModule } from '../lib/use-slide-module';

export function Export() {
  const { slideId = '' } = useParams();
  const { slide, error } = useSlideModule(slideId);
  const hasPages = Boolean(slide?.default?.length);

  useEffect(() => {
    if (!slide || !hasPages) return;

    window.openSlideCliExport = async (format: ExportFormat) => {
      if (format === 'html') {
        const { exportSlideAsHtml } = await import('../lib/export-html');
        await exportSlideAsHtml(slide, slideId);
      } else if (format === 'pdf') {
        const { exportSlideAsPdf } = await import('../lib/export-pdf');
        if (!window.openSlideCliSavePdf)
          throw new Error('PDF export requires a browser connection.');
        await exportSlideAsPdf(slide, slideId, undefined, window.openSlideCliSavePdf);
      } else {
        const { exportSlideAsPptx, exportSlideAsImagePptx } = await import('../lib/export-pptx');
        await (format === 'pptx' ? exportSlideAsPptx : exportSlideAsImagePptx)(slide, slideId);
      }
    };

    return () => {
      delete window.openSlideCliExport;
    };
  }, [slide, slideId, hasPages]);

  const message = error ?? (slide && !hasPages ? `Slide "${slideId}" has no pages.` : null);
  return message ? <pre data-osd-export-error>{message}</pre> : null;
}
