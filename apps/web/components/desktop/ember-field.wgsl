import { hash2 } from "@vgpu/wgsl-std/hash";
import { fbmSimplex3d } from "@vgpu/wgsl-std/noise/simplex";

struct Params {
  time: f32,
  intensity: f32,
  pointer: vec2f,
  resolution: vec2f,
  pixelRatio: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

const BASE = vec3f(0.027, 0.024, 0.031);
const DEEP = vec3f(0.32, 0.06, 0.03);
const EMBER = vec3f(0.996, 0.322, 0.149);
const HOT = vec3f(1.0, 0.66, 0.46);

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = params.resolution;
  let t = params.time;
  // One unit is 900 CSS px, so the light keeps its size however tall the canvas is.
  let size = res / max(params.pixelRatio, 1.0);
  let p = vec2f((uv.x - 0.5) * size.x, uv.y * size.y) / 900.0;

  let lean = (params.pointer - vec2f(0.5)) * vec2f(0.16, 0.04);
  let source = vec2f(lean.x, 0.22 + lean.y);
  let d = (p - source) * vec2f(0.62, 1.35);

  let smoke = fbmSimplex3d(vec3f(p * 1.4, t * 0.035), 4, 2.0, 0.5);
  let wisp = fbmSimplex3d(vec3f(p * vec2f(2.2, 3.6) + vec2f(0.0, t * 0.02), t * 0.025 + 11.0), 3, 2.0, 0.5);

  let r = length(d) + smoke * 0.045;
  let bloom = exp(-r * r * 14.0) * 0.44;
  let halo = exp(-r * 3.0) * 0.13;
  let veil = smoothstep(0.2, 0.9, wisp * 0.5 + 0.5) * exp(-length(d) * 2.8) * 0.08;
  let horizon = exp(-pow((p.y - 1.0) * 5.0, 2.0)) * exp(-abs(p.x) * 2.2) * (0.06 + smoke * 0.02);
  let glow = (bloom + halo + veil + horizon) * params.intensity;

  var tint = mix(DEEP, EMBER, smoothstep(0.02, 0.4, glow));
  tint = mix(tint, HOT, smoothstep(0.45, 0.75, glow));
  var color = BASE + tint * glow;

  let edge = length(vec2f(p.x * 0.8, p.y - 0.35));
  color *= mix(0.6, 1.0, smoothstep(1.2, 0.3, edge));

  let grain = hash2(uv * res + fract(t * 0.37) * vec2f(173.0, 311.0)).x - 0.5;
  color += grain * 0.022;

  return vec4f(color, 1.0);
}
