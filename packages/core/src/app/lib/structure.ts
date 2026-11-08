export type ElementLoc = { line: number; column: number };
export type StyleMap = Record<string, string | number>;

export const SHAPE_KINDS = [
  'rect',
  'ellipse',
  'triangle',
  'right-triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
  'chevron',
  'callout',
  'line',
  'line-arrow',
] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export type ElementSpec =
  | { type: 'text'; text: string; style: StyleMap }
  | {
      type: 'shape';
      kind: ShapeKind;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      style: StyleMap;
    }
  | { type: 'image'; assetPath: string; alt?: string; style: StyleMap }
  | { type: 'jsx'; code: string; style?: StyleMap };

export type StructureOp =
  | { kind: 'insert'; pageIndex: number; element: ElementSpec }
  | { kind: 'delete'; targets: ElementLoc[] }
  | { kind: 'duplicate'; targets: ElementLoc[]; style?: StyleMap }
  | { kind: 'group'; targets: ElementLoc[]; style: StyleMap; childStyles?: StyleMap[] }
  | { kind: 'ungroup'; target: ElementLoc; childStyles?: StyleMap[] }
  | { kind: 'page-style'; pageIndex: number; style: StyleMap };

// HTTP status the edit API answers with when a change targets a locked element.
export const LOCKED_STATUS = 423;

export const PAGE_LAYOUTS = [
  'blank',
  'title',
  'title-body',
  'section',
  'two-column',
  'image',
  'quote',
] as const;
export type PageLayout = (typeof PAGE_LAYOUTS)[number];

// Placeholder copy for a new page, localized by the caller.
export type PageLayoutText = {
  title: string;
  subtitle: string;
  body: string;
  quote: string;
  attribution: string;
  imageHint: string;
};
