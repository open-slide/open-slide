'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from './use-reduced-motion';

const TILT = 14;
const SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

// The desktop app's icon, rebuilt in layers so the slide can float above the
// tile and catch the light as the cursor moves.
export function AppIcon({ size = 104, className = '' }: { size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, SPRING);
  const y = useSpring(py, SPRING);
  const rotateY = useTransform(x, [-1, 1], [-TILT, TILT]);
  const rotateX = useTransform(y, [-1, 1], [TILT, -TILT]);
  const slideX = useTransform(x, [-1, 1], [-size * 0.035, size * 0.035]);
  const slideY = useTransform(y, [-1, 1], [-size * 0.035, size * 0.035]);
  const sheenX = useTransform(x, [-1, 1], [20, 80]);
  const sheenY = useTransform(y, [-1, 1], [10, 70]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgb(255 255 255 / 0.55), transparent 55%)`;

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const reach = Math.max(window.innerWidth, window.innerHeight) * 0.45;
      px.set(Math.max(-1, Math.min(1, (e.clientX - cx) / reach)));
      py.set(Math.max(-1, Math.min(1, (e.clientY - cy) / reach)));
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, px, py]);

  const radius = size * 0.233;

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <div
        aria-hidden
        className="icon-glow absolute inset-[-40%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgb(254 82 38 / 0.45), transparent 62%)',
          filter: 'blur(12px)',
        }}
      />
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: radius,
            background: 'linear-gradient(180deg, #ffffff 0%, #efebe6 100%)',
            boxShadow:
              'inset 0 1px 0 rgb(255 255 255 / 0.95), inset 0 -2px 0 rgb(0 0 0 / 0.06), 0 1px 1px rgb(0 0 0 / 0.3), 0 24px 48px -16px rgb(0 0 0 / 0.8), 0 30px 70px -20px rgb(254 82 38 / 0.5)',
          }}
        >
          <motion.div
            className="absolute inset-0 mix-blend-soft-light"
            style={{ background: sheen }}
          />
        </div>
        <motion.div
          className="absolute"
          style={{
            left: '20%',
            top: '32.5%',
            width: '60%',
            height: '35%',
            borderRadius: size * 0.071,
            background: 'linear-gradient(180deg, #ff8a5e 0%, #fe5226 45%, #ee4316 100%)',
            boxShadow:
              'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -1px 0 rgb(184 48 12 / 0.5), 0 10px 18px -6px rgb(254 82 38 / 0.55), 0 2px 4px rgb(138 35 6 / 0.3)',
            x: slideX,
            y: slideY,
            translateZ: size * 0.22,
          }}
        />
      </motion.div>
    </div>
  );
}
