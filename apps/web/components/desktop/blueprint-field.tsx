'use client';

import { type RefObject, useEffect, useRef } from 'react';

const CELL_W = 11;
const CELL_H = 18;
const FONT_PX = 13;
const RAMP = ' .`-:;=+*#%@';
const DIRS = '-\\|/';
const SCRAMBLE = '01<>/\\[]{}#*+=~';
const GLYPHS = Array.from(new Set(`${RAMP}${DIRS}${SCRAMBLE}+|-`)).join('');

const BG = '#081a33';
const INK = { blue: '#8ec5ff', white: '#eaf4ff', ember: '#ff8a5e' } as const;
type Ink = keyof typeof INK;

const EXPAND_S = 1.6;
const RETRACT_S = 0.7;
const EDGE_BAND = 56;
const LENS_R = 110;
const PUSH_R = 150;
const PUSH_PX = 20;
const RIPPLE_SPEED = 560;
const RIPPLE_LIFE = 1.6;
const MAX_RIPPLES = 10;

type Ripple = { x: number; y: number; t0: number; amp: number };

const hash = (a: number, b: number, c: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

// One curve for both directions keeps the radius continuous when the toggle flips mid-reveal;
// played backwards it eases in, so the retract starts slow and snaps into the logo.
const ease = (t: number) => 1 - (1 - t) ** 2;

function buildAtlas(dpr: number, family: string) {
  const atlases = {} as Record<Ink, HTMLCanvasElement>;
  for (const ink of Object.keys(INK) as Ink[]) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(GLYPHS.length * CELL_W * dpr);
    c.height = Math.ceil(CELL_H * dpr);
    const g = c.getContext('2d');
    if (!g) continue;
    g.scale(dpr, dpr);
    g.font = `500 ${FONT_PX}px ${family}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = INK[ink];
    for (let i = 0; i < GLYPHS.length; i++) {
      g.fillText(GLYPHS[i], i * CELL_W + CELL_W / 2, CELL_H / 2 + 0.5);
    }
    atlases[ink] = c;
  }
  return atlases;
}

const isInteractive = (el: EventTarget | null) =>
  el instanceof Element && !!el.closest('a, button, input, textarea, select, [role="button"]');

// Renders the hero's ember glow as blueprint-blue ASCII, revealed in a ring that grows out of
// the logo, and lets the cursor disturb it: a lens that scrambles and then settles on hover, a drag that shoves
// cells aside and leaves a directional trail, and ripples on press and release.
export function BlueprintField({
  active,
  originRef,
  className = '',
}: {
  active: boolean;
  originRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    activeRef.current = active;
    wakeRef.current();
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const host = canvas.closest('section') ?? canvas.parentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let dpr = 1;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let dir = new Uint8Array(0);
    let charge = new Float32Array(0);
    let charged = false;
    let atlas: Record<Ink, HTMLCanvasElement> | null = null;
    const index = new Map([...GLYPHS].map((g, i) => [g, i]));
    const origin = { x: 0, y: 0 };
    let maxR = 0;
    let progress = 0;
    let raf = 0;
    let last = 0;
    let time = 0;
    let inView = true;
    let sinceDraw = 0;

    const pointer = { x: -1e4, y: -1e4, inside: false, speed: 0 };
    const lastPointer = { x: -1e4, y: -1e4 };
    const lean = { x: 0.5, y: 0.5 };
    let dragging = false;
    let drag = 0;
    let prev: { x: number; y: number } | null = null;
    const ripples: Ripple[] = [];

    const family = () =>
      getComputedStyle(canvas).getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';

    const measureOrigin = () => {
      const el = originRef.current;
      const rect = canvas.getBoundingClientRect();
      if (el) {
        const o = el.getBoundingClientRect();
        origin.x = o.left + o.width / 2 - rect.left;
        origin.y = o.top + o.height / 2 - rect.top;
      } else {
        origin.x = w / 2;
        origin.y = 160;
      }
      maxR = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y)) + 40;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / CELL_W);
      rows = Math.ceil(h / CELL_H);
      heat = new Float32Array(cols * rows);
      dir = new Uint8Array(cols * rows);
      charge = new Float32Array(cols * rows);
      atlas = buildAtlas(dpr, family());
      measureOrigin();
    };

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
    };

    const stamp = (x0: number, y0: number, x1: number, y1: number) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      const angle = Math.atan2(dy, dx);
      const d = ((Math.round(angle / (Math.PI / 4)) % 4) + 4) % 4;
      const steps = Math.ceil(len / (CELL_W * 0.5));
      const boost = Math.min(1, len / 24);
      for (let s = 0; s <= steps; s++) {
        const px = x0 + (dx * s) / steps;
        const py = y0 + (dy * s) / steps;
        const cc = Math.floor(px / CELL_W);
        const cr = Math.floor(py / CELL_H);
        for (let r = cr - 2; r <= cr + 2; r++) {
          if (r < 0 || r >= rows) continue;
          for (let c = cc - 3; c <= cc + 3; c++) {
            if (c < 0 || c >= cols) continue;
            const fx = (c * CELL_W + CELL_W / 2 - px) / (CELL_W * 2.6);
            const fy = (r * CELL_H + CELL_H / 2 - py) / (CELL_H * 1.6);
            const f = Math.max(0, 1 - (fx * fx + fy * fy));
            if (f <= 0) continue;
            const i = r * cols + c;
            heat[i] = Math.min(1.2, heat[i] + f * 0.8 * (0.4 + boost));
            dir[i] = d;
          }
        }
      }
    };

    const ripple = (x: number, y: number, amp: number) => {
      ripples.push({ x, y, t0: time, amp });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (progress <= 0 || !atlas) return;

      const revealing = progress < 1;
      const R = revealing ? ease(progress) * maxR : maxR * 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, Math.max(0, R), 0, Math.PI * 2);
      ctx.fillStyle = BG;
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = 'rgb(142 197 255 / 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c += 4) {
        const x = Math.round(c * CELL_W) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let r = 0; r <= rows; r += 4) {
        const y = Math.round(r * CELL_H) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      const t = time;
      const unit = 900;
      const sx = (lean.x - 0.5) * 0.16;
      const sy = origin.y / unit + 0.06 + (lean.y - 0.5) * 0.04;
      const gw = CELL_W * dpr;
      const gh = CELL_H * dpr;
      const tick = Math.floor(t * 14);
      const live = ripples.filter((rp) => t - rp.t0 < RIPPLE_LIFE);
      const R2 = R * R;
      let ink: Ink | null = null;

      // Only rows on screen are drawn while animating; the static reduced-motion frame needs them all.
      const top = -canvas.getBoundingClientRect().top;
      const all = motion.matches;
      const r0 = all ? 0 : Math.max(0, Math.floor((top - PUSH_PX) / CELL_H));
      const r1 = all
        ? rows
        : Math.min(rows, Math.ceil((top + window.innerHeight + PUSH_PX) / CELL_H));
      for (let r = r0; r < r1; r++) {
        const cy = r * CELL_H + CELL_H / 2;
        for (let c = 0; c < cols; c++) {
          const cx = c * CELL_W + CELL_W / 2;
          const odx = cx - origin.x;
          const ody = cy - origin.y;
          const od2 = odx * odx + ody * ody;
          if (od2 > R2) continue;

          const px = (cx - w / 2) / unit;
          const py = cy / unit;
          const n =
            Math.sin(px * 6.1 + t * 0.35 + Math.sin(py * 4.3 - t * 0.27)) *
            Math.sin(py * 5.3 - t * 0.31 + Math.sin(px * 3.7 + t * 0.19));
          const ex = (px - sx) * 0.62;
          const ey = (py - sy) * 1.35;
          const rr = Math.sqrt(ex * ex + ey * ey) + n * 0.07;
          const grain = Math.sin(px * 31 + t * 0.6 + n * 3) * Math.sin(py * 27 - t * 0.5);
          let b =
            (Math.exp(-rr * rr * 18) * 0.78 + Math.exp(-rr * 3.2) * 0.32) * (0.82 + grain * 0.18) +
            (n * 0.5 + 0.5) * 0.14 +
            Math.exp(-(((py - 1.0) * 5) ** 2)) * Math.exp(-Math.abs(px) * 2.2) * 0.18;

          let ox = 0;
          let oy = 0;
          for (const rp of live) {
            const age = t - rp.t0;
            const dx = cx - rp.x;
            const dy = cy - rp.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const k = (d - age * RIPPLE_SPEED) / 34;
            if (k < -3 || k > 3) continue;
            const wave = Math.exp(-k * k) * (1 - age / RIPPLE_LIFE) * rp.amp;
            b += wave * 0.7;
            ox += (dx / d) * wave * 7;
            oy += (dy / d) * wave * 7;
          }

          if (pointer.inside) {
            const dx = cx - pointer.x;
            const dy = cy - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (drag > 0.01 && d2 < PUSH_R * PUSH_R) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / PUSH_R) ** 2 * PUSH_PX * drag;
              ox += (dx / d) * f;
              oy += (dy / d) * f;
            }
          }

          const i = r * cols + c;
          const chargeV = charge[i];
          b += chargeV * 0.5;
          // A fixed per-cell threshold makes cells settle one by one as the charge fades,
          // and the flicker slows with it, instead of every cell blinking at random.
          const scramble = chargeV > 0.04 && hash(c, r, 7) < chargeV * 1.4;
          const heatV = heat[i];
          let glyph: string;
          let alpha: number;
          let want: Ink;

          const edge = revealing ? R - Math.sqrt(od2) : Number.POSITIVE_INFINITY;
          if (edge < EDGE_BAND) {
            const f = 1 - edge / EDGE_BAND;
            glyph = SCRAMBLE[Math.floor(hash(c, r, tick) * SCRAMBLE.length)];
            alpha = 0.25 + f * 0.75;
            want = 'white';
          } else if (heatV > 0.12) {
            glyph = heatV > 0.95 ? '#' : DIRS[dir[i]];
            alpha = Math.min(1, heatV);
            want = 'ember';
          } else if (scramble) {
            const step = Math.floor(t * (2 + chargeV * 8) + hash(c, r, 3) * 9);
            glyph = SCRAMBLE[Math.floor(hash(r, c, step) * SCRAMBLE.length)];
            alpha = 0.35 + chargeV * 0.65;
            want = chargeV > 0.4 ? 'white' : 'blue';
          } else {
            const v = Math.min(1, Math.max(0, b));
            const gi = Math.floor(v * (RAMP.length - 1) + hash(c, r, 0) * 0.6);
            glyph = RAMP[Math.min(RAMP.length - 1, gi)];
            if (glyph === ' ') {
              if (c % 4 === 0 && r % 4 === 0) glyph = '+';
              else continue;
              alpha = 0.22;
            } else {
              alpha = 0.14 + v * 0.6;
            }
            want = v > 0.9 ? 'white' : 'blue';
          }

          const gi = index.get(glyph);
          if (gi === undefined) continue;
          if (want !== ink) ink = want;
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            atlas[ink],
            gi * gw,
            0,
            gw,
            gh,
            c * CELL_W + ox,
            r * CELL_H + oy,
            CELL_W,
            CELL_H,
          );
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (revealing && R > 0) {
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgb(234 244 255 / 0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const step = (now: number) => {
      raf = 0;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      time += dt;

      const target = activeRef.current ? 1 : 0;
      if (progress !== target) {
        const dur = target ? EXPAND_S : RETRACT_S;
        progress = target ? Math.min(1, progress + dt / dur) : Math.max(0, progress - dt / dur);
      }

      lean.x += ((pointer.inside ? pointer.x / w : 0.5) - lean.x) * 0.04;
      lean.y += ((pointer.inside ? pointer.y / h : 0.5) - lean.y) * 0.04;
      drag += ((dragging ? 1 : 0) - drag) * (dragging ? 0.25 : 0.08);
      if (dt > 0) {
        const moved = Math.hypot(pointer.x - lastPointer.x, pointer.y - lastPointer.y);
        pointer.speed += (Math.min(moved / dt, 1500) - pointer.speed) * 0.2;
      }
      lastPointer.x = pointer.x;
      lastPointer.y = pointer.y;
      const fade = 0.965 ** (dt * 60);
      charged = false;
      for (let i = 0; i < charge.length; i++) {
        if (charge[i] > 0.002) {
          charge[i] *= fade;
          charged = true;
        } else charge[i] = 0;
      }
      if (pointer.inside && activeRef.current) {
        // A still cursor only shimmers; moving it leaves a wake that fades out behind it.
        const gain = 0.45 + Math.min(pointer.speed / 500, 1) * 0.55;
        const c0 = Math.max(0, Math.floor((pointer.x - LENS_R) / CELL_W));
        const c1 = Math.min(cols - 1, Math.ceil((pointer.x + LENS_R) / CELL_W));
        const q0 = Math.max(0, Math.floor((pointer.y - LENS_R) / CELL_H));
        const q1 = Math.min(rows - 1, Math.ceil((pointer.y + LENS_R) / CELL_H));
        for (let r = q0; r <= q1; r++) {
          for (let c = c0; c <= c1; c++) {
            const d = Math.hypot(
              c * CELL_W + CELL_W / 2 - pointer.x,
              r * CELL_H + CELL_H / 2 - pointer.y,
            );
            if (d >= LENS_R) continue;
            const f = (1 - d / LENS_R) ** 1.5 * gain;
            const i = r * cols + c;
            if (f > charge[i]) charge[i] += (f - charge[i]) * 0.5;
            charged = true;
          }
        }
      }
      const decay = 0.965 ** (dt * 60);
      for (let i = 0; i < heat.length; i++) if (heat[i] > 0.001) heat[i] *= decay;

      // Left alone, the field drifts slowly enough that 30fps reads the same and costs half.
      sinceDraw += dt;
      const busy =
        progress < 1 || dragging || charged || ripples.some((rp) => time - rp.t0 < RIPPLE_LIFE);
      if (busy || sinceDraw >= 1 / 30 - 0.004) {
        sinceDraw = 0;
        draw();
      }
      if (progress === 0 && !activeRef.current) {
        last = 0;
        return;
      }
      if (inView && document.visibilityState === 'visible') raf = requestAnimationFrame(step);
      else last = 0;
    };

    const wake = () => {
      if (motion.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        progress = activeRef.current ? 1 : 0;
        draw();
        return;
      }
      if (!raf && (activeRef.current || progress > 0)) {
        if (activeRef.current && progress === 0) measureOrigin();
        raf = requestAnimationFrame(step);
      }
    };
    wakeRef.current = wake;

    const interactive = () => activeRef.current && !motion.matches;

    const onMove = (e: PointerEvent) => {
      if (!interactive()) return;
      const p = toLocal(e);
      pointer.inside = p.x >= 0 && p.y >= 0 && p.x <= p.rect.width && p.y <= p.rect.height;
      pointer.x = p.x;
      pointer.y = p.y;
      if (dragging && prev) {
        stamp(prev.x, prev.y, p.x, p.y);
        prev = { x: p.x, y: p.y };
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!interactive() || e.button !== 0 || isInteractive(e.target)) return;
      const p = toLocal(e);
      if (p.y > p.rect.height) return;
      pointer.inside = true;
      pointer.x = p.x;
      pointer.y = p.y;
      ripple(p.x, p.y, 1);
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      dragging = true;
      prev = { x: p.x, y: p.y };
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (prev) ripple(prev.x, prev.y, 0.6);
      prev = null;
    };
    const onLeave = () => {
      pointer.inside = false;
      onUp();
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) wake();
    });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') wake();
    };
    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resize();
        if (motion.matches || !raf) draw();
      });
    });

    resize();
    void document.fonts?.ready.then(() => {
      atlas = buildAtlas(dpr, family());
      if (!raf) draw();
    });
    ro.observe(canvas);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', wake);
    window.addEventListener('pointermove', onMove, { passive: true });
    host?.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    wake();

    return () => {
      wakeRef.current = () => {};
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', wake);
      window.removeEventListener('pointermove', onMove);
      host?.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [originRef]);

  return (
    <div aria-hidden className={`blueprint-field ${className}`}>
      <canvas ref={canvasRef} className="blueprint-canvas" />
    </div>
  );
}
