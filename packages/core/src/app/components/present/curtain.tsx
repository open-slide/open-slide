import { cn } from '@/lib/utils';

export const CURTAIN_FADE_MS = 400;

type Props = {
  opaque: boolean;
  className?: string;
};

export function PresentCurtain({ opaque, className }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none inset-0 bg-black transition-opacity ease-in-out',
        opaque ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{ transitionDuration: `${CURTAIN_FADE_MS}ms` }}
    />
  );
}

// Two frames so the opaque state is painted before the fade starts;
// a single rAF can land in the same style recalc and skip the transition.
export function afterPaint(cb: () => void): () => void {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(cb);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}

export function whenFullscreenSettled(cb: () => void, maxWaitMs = 800): () => void {
  let fired = false;
  const timer = window.setTimeout(done, maxWaitMs);
  document.addEventListener('fullscreenchange', done);
  function done() {
    if (fired) return;
    fired = true;
    cleanup();
    cb();
  }
  function cleanup() {
    window.clearTimeout(timer);
    document.removeEventListener('fullscreenchange', done);
  }
  return cleanup;
}
