'use client';

import { useEffect, useRef, useState } from 'react';
import {
  clock,
  effect,
  type FrameLoopHandle,
  frame,
  frameLoop,
  type Gpu,
  init,
  surface,
} from 'vgpu';
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

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0.5, y: 0.5 };
    const aim = { x: 0.5, y: 0.5 };
    let disposed = false;
    let gpu: Gpu | undefined;
    let loop: FrameLoopHandle | undefined;
    let sync: (() => void) | undefined;
    let inView = true;
    let resizeRaf = 0;

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
      inView = entry.isIntersecting;
      sync?.();
    });
    const onChange = () => sync?.();

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

      const device = gpu;
      try {
        const target = surface(device, canvas, { dpr: [1, 1.5] });
        const field = effect(device, emberShader, {
          label: 'ember-field',
          set: {
            params: {
              time: TIME_OFFSET,
              intensity: 0,
              pointer: [0.5, 0.5],
              resolution: target.size,
              pixelRatio: target.dpr,
            },
          },
        });
        const time = clock(device);
        let elapsed = 0;
        let last = 0;

        const still = () => {
          field.set({ params: { time: TIME_OFFSET + elapsed, intensity: 1 } });
          frame(device, (f) => f.pass(target, field));
        };

        // Resizing clears the canvas, and vgpu forbids opening a frame inside a resize callback.
        target.onResize(() => {
          field.set({ params: { resolution: target.size, pixelRatio: target.dpr } });
          if (!motion.matches) return;
          cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(still);
        });

        sync = () => {
          if (motion.matches) {
            stop();
            still();
            return;
          }
          if (!inView || document.visibilityState !== 'visible') {
            stop();
            return;
          }
          if (loop) return;
          last = time.time;
          loop = frameLoop(
            device,
            (f) => {
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
              f.pass(target, field);
            },
            { fps: 60 },
          );
        };
        sync();
      } catch {
        sync = undefined;
        stop();
        device.dispose();
        gpu = undefined;
        return;
      }

      setLit(true);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    })();

    observer.observe(canvas);
    document.addEventListener('visibilitychange', onChange);
    motion.addEventListener('change', onChange);

    return () => {
      disposed = true;
      sync = undefined;
      cancelAnimationFrame(resizeRaf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onChange);
      motion.removeEventListener('change', onChange);
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
