import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
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

type Settle = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

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

type PageErrorBoundaryProps = {
  resetKey: unknown;
  onError: (error: unknown) => void;
  children: ReactNode;
};

class PageErrorBoundary extends Component<PageErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  componentDidUpdate(prev: PageErrorBoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Preview() {
  const { slideId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { slide, error: loadError } = useSlideModule(slideId);
  const frameRef = useRef<HTMLDivElement>(null);
  const [settle, setSettle] = useState<Settle>({ status: 'loading' });
  const [renderError, setRenderError] = useState<{ page: unknown; message: string } | null>(null);

  const pageParam = parseIntParam(searchParams.get('p'));
  const stepParam = parseIntParam(searchParams.get('step'));
  const pages = slide?.default ?? [];
  const pageNumber = pageParam ?? 1;
  const Page = pages[pageNumber - 1];

  let inputError = loadError;
  if (!inputError && slide) {
    if (pages.length === 0) inputError = `Slide "${slideId}" has no pages.`;
    else if (!Page) {
      inputError = `Page ${searchParams.get('p')} is out of range (1–${pages.length}).`;
    } else if (stepParam !== null && (Number.isNaN(stepParam) || stepParam < 0)) {
      inputError = `Invalid step "${searchParams.get('step')}" — expected a non-negative integer.`;
    }
  }

  useDocumentTitle(slide ? `${slide.meta?.title ?? slideId} · ${pageNumber}` : undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step reveals content that has to settle again
  useEffect(() => {
    setSettle({ status: 'loading' });
    if (!Page || inputError) return;
    let cancelled = false;
    (async () => {
      await nextPaint();
      const frame = frameRef.current;
      if (!frame) return;
      const deadline = performance.now() + SETTLE_TIMEOUT_MS;
      const remaining = () => Math.max(0, deadline - performance.now());
      await waitForFonts();
      const targetsFound = await waitForDataWaitfor(frame, remaining());
      await waitForImages(frame, deadline);
      while (!cancelled && !isFrameAnimationSettled(frame) && remaining() > 0) {
        await sleep(POLL_INTERVAL_MS);
      }
      const animationsSettled = isFrameAnimationSettled(frame);
      await nextPaint();
      if (cancelled) return;
      if (!targetsFound) {
        setSettle({
          status: 'error',
          message: 'Timed out waiting for a [data-waitfor] target to appear.',
        });
      } else if (!animationsSettled) {
        setSettle({ status: 'error', message: 'Timed out waiting for animations to finish.' });
      } else {
        setSettle({ status: 'ready' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [Page, inputError, stepParam]);

  const pageError = renderError && renderError.page === Page ? renderError.message : null;
  const error = inputError ?? pageError ?? (settle.status === 'error' ? settle.message : null);
  const state = error ? 'error' : settle.status;

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
              <PageErrorBoundary
                resetKey={Page}
                onError={(e) =>
                  setRenderError({
                    page: Page,
                    message: `Page ${pageNumber} threw while rendering:\n${e instanceof Error ? (e.stack ?? e.message) : String(e)}`,
                  })
                }
              >
                {stepParam === null ? (
                  <Page />
                ) : (
                  <PreviewStepHost revealed={stepParam}>
                    <Page />
                  </PreviewStepHost>
                )}
              </PageErrorBoundary>
            </SlidePageProvider>
          </SlideCanvas>
        )
      )}
    </div>
  );
}
