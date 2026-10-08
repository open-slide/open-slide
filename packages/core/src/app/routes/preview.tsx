import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/lib/use-document-title';
import { PreviewStepHost } from '../components/preview-step-host';
import { SlideCanvas } from '../components/slide-canvas';
import { nextPaint, sleep } from '../lib/dom';
import { SlidePageProvider } from '../lib/page-context';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from '../lib/print-ready';
import { useSlideModule } from '../lib/use-slide-module';

const SETTLE_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 50;

type PreviewState = 'loading' | 'ready' | 'error';

function parseIntParam(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : Number.NaN;
}

async function waitForImages(root: HTMLElement, deadline: number): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.race([
    Promise.all(images.map((img) => img.decode().catch(() => {}))),
    sleep(Math.max(0, deadline - performance.now())),
  ]);
}

export function Preview() {
  const { slideId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { slide, error: loadError } = useSlideModule(slideId);
  const frameRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const pageParam = parseIntParam(searchParams.get('p'));
  const stepParam = parseIntParam(searchParams.get('step'));
  const pages = slide?.default ?? [];
  const pageNumber = pageParam ?? 1;
  const Page = pages[pageNumber - 1];

  let error = loadError;
  if (!error && slide) {
    if (pages.length === 0) error = `Slide "${slideId}" has no pages.`;
    else if (!Page) error = `Page ${searchParams.get('p')} is out of range (1–${pages.length}).`;
    else if (stepParam !== null && (Number.isNaN(stepParam) || stepParam < 0)) {
      error = `Invalid step "${searchParams.get('step')}" — expected a non-negative integer.`;
    }
  }

  useDocumentTitle(slide ? `${slide.meta?.title ?? slideId} · ${pageNumber}` : undefined);

  useEffect(() => {
    setReady(false);
    if (!Page || error) return;
    let cancelled = false;
    (async () => {
      await nextPaint();
      const frame = frameRef.current;
      if (!frame) return;
      const deadline = performance.now() + SETTLE_TIMEOUT_MS;
      await waitForFonts();
      await waitForImages(frame, deadline);
      await waitForDataWaitfor(frame, Math.max(0, deadline - performance.now()));
      while (!cancelled && !isFrameAnimationSettled(frame) && performance.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);
      }
      await nextPaint();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [Page, error]);

  const state: PreviewState = error ? 'error' : ready ? 'ready' : 'loading';

  return (
    <div
      ref={frameRef}
      data-osd-preview={state}
      data-osd-preview-page={Page ? pageNumber : undefined}
      data-osd-preview-total={slide ? pages.length : undefined}
      className="h-screen w-screen overflow-hidden bg-black"
    >
      {error ? (
        <pre
          data-osd-preview-error
          className="m-0 p-6 font-mono text-[14px] whitespace-pre-wrap text-red-400"
        >
          {error}
        </pre>
      ) : (
        slide &&
        Page && (
          <SlideCanvas flat freezeMotion design={slide.design}>
            <SlidePageProvider index={pageNumber - 1} total={pages.length}>
              {stepParam === null ? (
                <Page />
              ) : (
                <PreviewStepHost revealed={stepParam}>
                  <Page />
                </PreviewStepHost>
              )}
            </SlidePageProvider>
          </SlideCanvas>
        )
      )}
    </div>
  );
}
