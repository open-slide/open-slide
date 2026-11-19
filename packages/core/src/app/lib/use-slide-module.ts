import config from 'virtual:open-slide/config';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlideModule } from './sdk';
import { describeLoadError, type SlideErrorInfo } from './slide-errors';
import { loadSlide, slideChangeIncludes } from './slides';

export function useSlideModule(slideId: string) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [error, setError] = useState<SlideErrorInfo | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(
    (reset: boolean) => {
      const seq = ++loadSeqRef.current;
      const startedAt = Date.now();
      // A failed hot reload keeps the previous module so the deck stays on
      // screen; `error` alongside a non-null `slide` means that module is stale.
      if (reset) {
        setSlide(null);
        setError(null);
      }
      loadSlide(slideId)
        .then((mod) => {
          if (seq !== loadSeqRef.current) return;
          setSlide(mod);
          setError(null);
        })
        .catch(async (e) => {
          const info = await describeLoadError(
            e,
            startedAt,
            `${config.slidesDir ?? 'slides'}/${slideId}`,
          );
          if (seq === loadSeqRef.current) setError(info);
        });
    },
    [slideId],
  );

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    if (!import.meta.hot) return;
    let cancelled = false;
    const handler = (data: unknown) => {
      if (slideChangeIncludes(data, slideId)) {
        queueMicrotask(() => {
          if (!cancelled) reload(false);
        });
      }
    };
    import.meta.hot.on('open-slide:slide-changed', handler);
    return () => {
      cancelled = true;
      import.meta.hot?.off('open-slide:slide-changed', handler);
    };
  }, [slideId, reload]);

  return { slide, error };
}
