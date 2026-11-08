'use client';

import { useEffect, useRef, useState } from 'react';
import { clock, effect, type FrameLoopHandle, frameLoop, type Gpu, init, surface } from 'vgpu';
import emberShader from './ember-field.wgsl';

const FADE_IN_S = 2.4;
const POINTER_EASE = 0.035;
// Starting deep into the noise field avoids the symmetric pattern at t = 0.
const TIME_OFFSET = 40;

export function EmberField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !('gpu' in navigator)) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0.5, y: 0.5 };
    const aim = { x: 0.5, y: 0.5 };
    let disposed = false;
    let gpu: Gpu | undefined;
    let loop: FrameLoopHandle | undefined;
    let start: (() => void) | undefined;
    let visible = true;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      aim.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      aim.y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    };

    const stop = () => {
      loop?.stop();
      loop = undefined;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === 'visible';
      if (visible) start?.();
      else stop();
    });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start?.();
      else stop();
    };

    void (async () => {
      try {
        gpu = await init({ powerPreference: 'low-power' });
      } catch {
        return;
      }
      if (disposed) {
        gpu.dispose();
        return;
      }

      const target = surface(gpu, canvas, { dpr: [1, 1.5] });
      const field = effect(gpu, emberShader, {
        label: 'ember-field',
        set: {
          params: {
            time: TIME_OFFSET,
            intensity: reduced ? 1 : 0,
            pointer: [0.5, 0.5],
            resolution: target.size,
            pixelRatio: target.dpr,
          },
        },
      });
      target.onResize(() =>
        field.set({ params: { resolution: target.size, pixelRatio: target.dpr } }),
      );

      if (reduced) {
        field.draw(target);
        setLit(true);
        return;
      }

      const time = clock(gpu);
      let elapsed = 0;
      let last = 0;
      start = () => {
        if (loop || !gpu || !visible) return;
        last = time.time;
        loop = frameLoop(
          gpu,
          (frame) => {
            elapsed += Math.min(time.time - last, 0.1);
            last = time.time;
            pointer.x += (aim.x - pointer.x) * POINTER_EASE;
            pointer.y += (aim.y - pointer.y) * POINTER_EASE;
            const t = Math.min(elapsed / FADE_IN_S, 1);
            field.set({
              params: {
                time: TIME_OFFSET + elapsed,
                intensity: 1 - (1 - t) ** 3,
                pointer: [pointer.x, pointer.y],
              },
            });
            frame.pass(target, field);
          },
          { fps: 60 },
        );
      };
      start();
      setLit(true);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    })();

    observer.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      stop();
      gpu?.dispose();
    };
  }, []);

  return (
    <div aria-hidden className={`ember-field ${className}`}>
      <canvas ref={canvasRef} data-lit={lit} className="ember-canvas" />
    </div>
  );
}
