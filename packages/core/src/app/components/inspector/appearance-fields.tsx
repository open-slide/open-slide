import { Blend, Radius, SquareDashed } from 'lucide-react';
import { ColorField, Field, NumberField, Section } from '@/components/panel/panel-fields';
import { SHAPE_VARS } from '@/components/shape';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveColor } from '@/lib/inspector/color';
import type { EditOp } from '@/lib/inspector/use-editor';
import { SHAPE_KINDS, type ShapeKind } from '@/lib/structure';
import { useLocale } from '@/lib/use-locale';
import { round2 } from '@/lib/utils';

export type ShadowPreset = 'none' | 'soft' | 'medium' | 'strong';

// Drop shadows follow the painted outline, so stars and text cast the shadow
// of their shape rather than of their bounding box.
const SHADOWS: Record<Exclude<ShadowPreset, 'none'>, string> = {
  soft: 'drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.18))',
  medium: 'drop-shadow(0px 8px 18px rgba(0, 0, 0, 0.24))',
  strong: 'drop-shadow(0px 18px 36px rgba(0, 0, 0, 0.32))',
};

export type Appearance = {
  opacity: number;
  radius: number;
  borderWidth: number;
  borderColor: string | null;
  shadow: ShadowPreset | null;
  shape: {
    kind: ShapeKind;
    fill: string | null;
    stroke: string | null;
    strokeWidth: number;
  } | null;
};

export function readAppearance(el: HTMLElement): Appearance {
  const cs = getComputedStyle(el);
  const kind = el.dataset.osShape as ShapeKind | undefined;
  const filter = el.style.filter;
  const shadow =
    !filter || filter === 'none'
      ? 'none'
      : ((Object.entries(SHADOWS).find(([, value]) => value === filter)?.[0] as ShadowPreset) ??
        null);
  return {
    opacity: round2(Number.parseFloat(cs.opacity) || 0),
    radius: Number.parseFloat(cs.borderTopLeftRadius) || 0,
    borderWidth: kind ? 0 : Number.parseFloat(cs.borderTopWidth) || 0,
    borderColor: kind ? null : resolveColor(el, cs.borderTopColor),
    shadow,
    shape:
      kind && SHAPE_KINDS.includes(kind)
        ? {
            kind,
            fill: resolveColor(el, cs.getPropertyValue(SHAPE_VARS.fill).trim()),
            stroke: resolveColor(el, cs.getPropertyValue(SHAPE_VARS.stroke).trim()),
            strokeWidth: Number.parseFloat(cs.getPropertyValue(SHAPE_VARS.strokeWidth)) || 0,
          }
        : null,
  };
}

function style(key: string, value: string | null): EditOp {
  return { kind: 'set-style', key, value };
}

export function ShapeSection({
  shape,
  apply,
  setKind,
}: {
  shape: NonNullable<Appearance['shape']>;
  apply: (ops: EditOp[]) => void;
  setKind: (kind: ShapeKind) => void;
}) {
  const t = useLocale();
  const isLine = shape.kind === 'line' || shape.kind === 'line-arrow';
  return (
    <Section title={t.inspector.insertShape}>
      <Field label={t.inspector.shapeKindLabel}>
        <Select
          items={Object.fromEntries(
            SHAPE_KINDS.map((kind) => [kind, t.inspector.shapeNames[kind]]),
          )}
          value={shape.kind}
          onValueChange={(value) => {
            if (value && value !== shape.kind) setKind(value as ShapeKind);
          }}
        >
          <SelectTrigger
            size="sm"
            className="min-w-0 flex-1 text-xs"
            aria-label={t.inspector.shapeKindLabel}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SHAPE_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind} className="text-xs">
                  {t.inspector.shapeNames[kind]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      {!isLine && (
        <ColorField
          label={t.inspector.fillLabel}
          value={shape.fill ?? '#ffffff'}
          dim={!shape.fill}
          onChange={(value) => apply([style(SHAPE_VARS.fill, value)])}
          onClear={shape.fill ? () => apply([style(SHAPE_VARS.fill, 'none')]) : undefined}
        />
      )}
      <ColorField
        label={t.inspector.strokeLabel}
        value={shape.stroke ?? '#000000'}
        dim={!shape.stroke}
        onChange={(value) => {
          const ops = [style(SHAPE_VARS.stroke, value)];
          if (shape.strokeWidth === 0) ops.push(style(SHAPE_VARS.strokeWidth, '2px'));
          apply(ops);
        }}
        onClear={shape.stroke ? () => apply([style(SHAPE_VARS.stroke, null)]) : undefined}
      />
      <Field label={t.inspector.strokeWidthLabel}>
        <NumberField
          label={t.inspector.strokeWidthLabel}
          value={round2(shape.strokeWidth)}
          onChange={(n) => apply([style(SHAPE_VARS.strokeWidth, `${round2(n)}px`)])}
          min={0}
          max={200}
          suffix="px"
          className="flex-1"
        />
      </Field>
    </Section>
  );
}

export function AppearanceSection({
  appearance,
  apply,
}: {
  appearance: Appearance;
  apply: (ops: EditOp[]) => void;
}) {
  const t = useLocale();
  const isShape = Boolean(appearance.shape);
  const shadowOptions: Array<{ value: ShadowPreset; label: string }> = [
    { value: 'none', label: t.inspector.shadowNone },
    { value: 'soft', label: t.inspector.shadowSoft },
    { value: 'medium', label: t.inspector.shadowMedium },
    { value: 'strong', label: t.inspector.shadowStrong },
  ];
  return (
    <Section title={t.inspector.appearanceSection}>
      <div className="flex items-center gap-1.5">
        <NumberField
          icon={Blend}
          label={t.inspector.opacityLabel}
          value={Math.round(appearance.opacity * 100)}
          onChange={(n) => apply([style('opacity', n >= 100 ? null : String(round2(n / 100)))])}
          min={0}
          max={100}
          suffix="%"
          className="basis-0 grow"
        />
        {(!isShape || appearance.shape?.kind === 'rect') && (
          <NumberField
            icon={Radius}
            label={t.inspector.radiusLabel}
            value={Math.round(appearance.radius)}
            onChange={(n) => apply([style('borderRadius', n === 0 ? null : `${Math.round(n)}px`)])}
            min={0}
            max={2000}
            suffix="px"
            className="basis-0 grow"
          />
        )}
      </div>
      {!isShape && (
        <div className="flex items-center gap-1.5">
          <NumberField
            icon={SquareDashed}
            label={t.inspector.borderLabel}
            value={Math.round(appearance.borderWidth)}
            onChange={(n) =>
              apply(
                n === 0
                  ? [
                      style('borderWidth', null),
                      style('borderStyle', null),
                      style('borderColor', null),
                    ]
                  : [
                      style('borderWidth', `${Math.round(n)}px`),
                      style('borderStyle', 'solid'),
                      ...(appearance.borderColor ? [] : [style('borderColor', 'currentColor')]),
                    ],
              )
            }
            min={0}
            max={200}
            suffix="px"
            className="w-24"
          />
        </div>
      )}
      {!isShape && appearance.borderWidth > 0 && (
        <ColorField
          label={t.inspector.borderColorLabel}
          value={appearance.borderColor ?? '#000000'}
          onChange={(value) => apply([style('borderColor', value)])}
        />
      )}
      <Field label={t.inspector.shadowLabel}>
        <Select
          items={Object.fromEntries(shadowOptions.map((option) => [option.value, option.label]))}
          value={appearance.shadow ?? undefined}
          onValueChange={(value) => {
            const preset = value as ShadowPreset;
            apply([style('filter', preset === 'none' ? null : SHADOWS[preset])]);
          }}
        >
          <SelectTrigger
            size="sm"
            className="min-w-0 flex-1 text-xs"
            aria-label={t.inspector.shadowLabel}
          >
            <SelectValue placeholder={t.inspector.shadowCustom} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {shadowOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </Section>
  );
}

type FontOption = { value: string; label: string };

function fontOptions(t: ReturnType<typeof useLocale>): FontOption[] {
  return [
    { value: 'var(--osd-font-display, inherit)', label: t.inspector.fontDisplay },
    { value: 'var(--osd-font-body, inherit)', label: t.inspector.fontBody },
    { value: 'system-ui, sans-serif', label: t.inspector.fontSans },
    { value: 'Georgia, serif', label: t.inspector.fontSerif },
    { value: 'ui-monospace, monospace', label: t.inspector.fontMono },
  ];
}

export function FontFamilyField({
  anchor,
  apply,
}: {
  anchor: HTMLElement;
  apply: (ops: EditOp[]) => void;
}) {
  const t = useLocale();
  const options = fontOptions(t);
  const inline = anchor.style.fontFamily;
  const current = options.find((option) => option.value === inline)?.value;
  const computed = getComputedStyle(anchor).fontFamily.split(',')[0]?.replace(/["']/g, '').trim();
  return (
    <Field label={t.inspector.fontLabel}>
      <Select
        items={Object.fromEntries(options.map((option) => [option.value, option.label]))}
        value={current ?? null}
        onValueChange={(value) => {
          if (value) apply([style('fontFamily', value)]);
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-0 flex-1 text-xs"
          aria-label={t.inspector.fontLabel}
        >
          <SelectValue placeholder={computed || t.inspector.fontBody} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                <span style={{ fontFamily: option.value }}>{option.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
