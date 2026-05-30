import type {
  TileryDirection,
  TileryDivider,
  TileryDividerOrientation,
  TileryInset,
  TileryLayoutState,
  TileryPanelId,
  TileryPanelState,
} from '../types';

export const TILERY_DEFAULT_MIN_PANEL_SIZE = 10;
const EPSILON = 0.0001;

const eq = (a: number, b: number) => Math.abs(a - b) < EPSILON;

export function tileryPanelLeft(p: TileryPanelState): number {
  return p.inset.left;
}
export function tileryPanelRight(p: TileryPanelState): number {
  return 100 - p.inset.right;
}
export function tileryPanelTop(p: TileryPanelState): number {
  return p.inset.top;
}
export function tileryPanelBottom(p: TileryPanelState): number {
  return 100 - p.inset.bottom;
}
export function tileryPanelWidth(p: TileryPanelState): number {
  return 100 - p.inset.left - p.inset.right;
}
export function tileryPanelHeight(p: TileryPanelState): number {
  return 100 - p.inset.top - p.inset.bottom;
}

export function tilerySplitInset(
  inset: TileryInset,
  direction: TileryDirection,
  sizePercent: number,
): { source: TileryInset; created: TileryInset } {
  const width = 100 - inset.left - inset.right;
  const height = 100 - inset.top - inset.bottom;
  const sizeClamped = Math.max(0, Math.min(100, sizePercent));

  if (direction === 'left' || direction === 'right') {
    const newWidth = (width * sizeClamped) / 100;
    if (direction === 'right') {
      return {
        source: { ...inset, right: inset.right + newWidth },
        created: { ...inset, left: inset.left + (width - newWidth) },
      };
    }
    return {
      source: { ...inset, left: inset.left + newWidth },
      created: { ...inset, right: inset.right + (width - newWidth) },
    };
  }
  const newHeight = (height * sizeClamped) / 100;
  if (direction === 'bottom') {
    return {
      source: { ...inset, bottom: inset.bottom + newHeight },
      created: { ...inset, top: inset.top + (height - newHeight) },
    };
  }
  return {
    source: { ...inset, top: inset.top + newHeight },
    created: { ...inset, bottom: inset.bottom + (height - newHeight) },
  };
}

export function tileryDeriveDividers(
  state: TileryLayoutState,
): TileryDivider[] {
  const panels = state.panelOrder
    .map((id) => state.panels[id])
    .filter((p): p is TileryPanelState => Boolean(p));
  const dividers: TileryDivider[] = [];

  const xMap = new Map<string, number>();
  for (const p of panels) {
    const l = tileryPanelLeft(p);
    const r = tileryPanelRight(p);
    xMap.set(roundCoord(l), l);
    xMap.set(roundCoord(r), r);
  }
  for (const xKey of xMap.keys()) {
    const x = xMap.get(xKey)!;
    if (x <= EPSILON || x >= 100 - EPSILON) continue;
    const lefts = panels.filter((p) => eq(tileryPanelRight(p), x));
    const rights = panels.filter((p) => eq(tileryPanelLeft(p), x));
    if (lefts.length === 0 || rights.length === 0) continue;
    const segments = computeAdjacentSegments(lefts, rights, 'vertical');
    for (const seg of segments) {
      const beforeKey = [...seg.before].sort().join(',');
      const afterKey = [...seg.after].sort().join(',');
      dividers.push({
        id: `v|${beforeKey}|${afterKey}`,
        orientation: 'vertical',
        position: x,
        start: seg.start,
        end: seg.end,
        beforePanels: seg.before,
        afterPanels: seg.after,
      });
    }
  }

  const yMap = new Map<string, number>();
  for (const p of panels) {
    const t = tileryPanelTop(p);
    const b = tileryPanelBottom(p);
    yMap.set(roundCoord(t), t);
    yMap.set(roundCoord(b), b);
  }
  for (const yKey of yMap.keys()) {
    const y = yMap.get(yKey)!;
    if (y <= EPSILON || y >= 100 - EPSILON) continue;
    const tops = panels.filter((p) => eq(tileryPanelBottom(p), y));
    const bottoms = panels.filter((p) => eq(tileryPanelTop(p), y));
    if (tops.length === 0 || bottoms.length === 0) continue;
    const segments = computeAdjacentSegments(tops, bottoms, 'horizontal');
    for (const seg of segments) {
      const beforeKey = [...seg.before].sort().join(',');
      const afterKey = [...seg.after].sort().join(',');
      dividers.push({
        id: `h|${beforeKey}|${afterKey}`,
        orientation: 'horizontal',
        position: y,
        start: seg.start,
        end: seg.end,
        beforePanels: seg.before,
        afterPanels: seg.after,
      });
    }
  }
  return dividers;
}

function roundCoord(n: number): string {
  return n.toFixed(3);
}

export type TileryJunction = {
  id: string;
  x: number;
  y: number;
  verticalDividerId: string;
  horizontalDividerId: string;
};

export function tileryDeriveJunctions(
  dividers: TileryDivider[],
): TileryJunction[] {
  const verticals = dividers.filter((d) => d.orientation === 'vertical');
  const horizontals = dividers.filter((d) => d.orientation === 'horizontal');
  const out: TileryJunction[] = [];
  for (const v of verticals) {
    for (const h of horizontals) {
      if (
        h.position >= v.start - EPSILON &&
        h.position <= v.end + EPSILON &&
        v.position >= h.start - EPSILON &&
        v.position <= h.end + EPSILON
      ) {
        out.push({
          id: `j|${v.id}|${h.id}`,
          x: v.position,
          y: h.position,
          verticalDividerId: v.id,
          horizontalDividerId: h.id,
        });
      }
    }
  }
  return out;
}

type Segment = {
  start: number;
  end: number;
  before: TileryPanelId[];
  after: TileryPanelId[];
};

type Range = { start: number; end: number };

function unionRanges(ranges: Range[]): Range[] {
  const sorted = ranges
    .filter((r) => r.end - r.start > EPSILON)
    .sort((a, b) => a.start - b.start);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end + EPSILON) {
      last.end = Math.max(last.end, r.end);
    } else {
      out.push({ start: r.start, end: r.end });
    }
  }
  return out;
}

function intersectRanges(a: Range[], b: Range[]): Range[] {
  const out: Range[] = [];
  for (const ra of a) {
    for (const rb of b) {
      const s = Math.max(ra.start, rb.start);
      const e = Math.min(ra.end, rb.end);
      if (e - s > EPSILON) out.push({ start: s, end: e });
    }
  }
  return out;
}

function computeAdjacentSegments(
  beforeSide: TileryPanelState[],
  afterSide: TileryPanelState[],
  orientation: TileryDividerOrientation,
): Segment[] {
  const orth = (p: TileryPanelState): Range =>
    orientation === 'vertical'
      ? { start: tileryPanelTop(p), end: tileryPanelBottom(p) }
      : { start: tileryPanelLeft(p), end: tileryPanelRight(p) };

  const beforeUnion = unionRanges(beforeSide.map(orth));
  const afterUnion = unionRanges(afterSide.map(orth));
  const intersection = intersectRanges(beforeUnion, afterUnion);

  return intersection.map(({ start, end }) => {
    const overlaps = (p: TileryPanelState) => {
      const o = orth(p);
      return o.start < end - EPSILON && o.end > start + EPSILON;
    };
    return {
      start,
      end,
      before: beforeSide.filter(overlaps).map((p) => p.id),
      after: afterSide.filter(overlaps).map((p) => p.id),
    };
  });
}

export function tileryClampDividerPosition(
  state: TileryLayoutState,
  divider: TileryDivider,
  targetPosition: number,
  minSizePercent: number = TILERY_DEFAULT_MIN_PANEL_SIZE,
): number {
  let min = 0;
  let max = 100;
  if (divider.orientation === 'vertical') {
    for (const id of divider.beforePanels) {
      const p = state.panels[id];
      if (!p) continue;
      const newRight = 100 - targetPosition;
      const width = 100 - p.inset.left - newRight;
      if (width < minSizePercent) {
        min = Math.max(min, p.inset.left + minSizePercent);
      }
    }
    for (const id of divider.afterPanels) {
      const p = state.panels[id];
      if (!p) continue;
      const width = 100 - targetPosition - p.inset.right;
      if (width < minSizePercent) {
        max = Math.min(max, 100 - p.inset.right - minSizePercent);
      }
    }
  } else {
    for (const id of divider.beforePanels) {
      const p = state.panels[id];
      if (!p) continue;
      const newBottom = 100 - targetPosition;
      const h = 100 - p.inset.top - newBottom;
      if (h < minSizePercent) {
        min = Math.max(min, p.inset.top + minSizePercent);
      }
    }
    for (const id of divider.afterPanels) {
      const p = state.panels[id];
      if (!p) continue;
      const h = 100 - targetPosition - p.inset.bottom;
      if (h < minSizePercent) {
        max = Math.min(max, 100 - p.inset.bottom - minSizePercent);
      }
    }
  }
  if (min > max) return divider.position;
  return Math.max(min, Math.min(max, targetPosition));
}

export function tilerySplitFitsMin(
  inset: TileryInset,
  direction: TileryDirection,
  sizePercent: number,
  minSizePercent: number = TILERY_DEFAULT_MIN_PANEL_SIZE,
): boolean {
  const { source, created } = tilerySplitInset(inset, direction, sizePercent);
  const tol = minSizePercent - EPSILON;
  const fits = (i: TileryInset) =>
    100 - i.left - i.right >= tol && 100 - i.top - i.bottom >= tol;
  return fits(source) && fits(created);
}

export function tileryApplyDividerResize(
  state: TileryLayoutState,
  divider: TileryDivider,
  newPosition: number,
): TileryLayoutState {
  const nextPanels = { ...state.panels };
  if (divider.orientation === 'vertical') {
    for (const id of divider.beforePanels) {
      const p = nextPanels[id];
      if (!p) continue;
      nextPanels[id] = {
        ...p,
        inset: { ...p.inset, right: 100 - newPosition },
      };
    }
    for (const id of divider.afterPanels) {
      const p = nextPanels[id];
      if (!p) continue;
      nextPanels[id] = { ...p, inset: { ...p.inset, left: newPosition } };
    }
  } else {
    for (const id of divider.beforePanels) {
      const p = nextPanels[id];
      if (!p) continue;
      nextPanels[id] = {
        ...p,
        inset: { ...p.inset, bottom: 100 - newPosition },
      };
    }
    for (const id of divider.afterPanels) {
      const p = nextPanels[id];
      if (!p) continue;
      nextPanels[id] = { ...p, inset: { ...p.inset, top: newPosition } };
    }
  }
  return { ...state, panels: nextPanels };
}

export function tileryFindCollapseFillers(
  panels: TileryPanelState[],
  removed: TileryPanelState,
): { id: TileryPanelId; inset: TileryInset }[] {
  const removedL = tileryPanelLeft(removed);
  const removedR = tileryPanelRight(removed);
  const removedT = tileryPanelTop(removed);
  const removedB = tileryPanelBottom(removed);

  type Side = {
    candidates: TileryPanelState[];
    range: (p: TileryPanelState) => Range;
    target: { start: number; end: number };
    patch: (p: TileryPanelState) => TileryInset;
  };

  const sides: Side[] = [
    {
      candidates: panels.filter(
        (p) =>
          p.id !== removed.id &&
          eq(tileryPanelLeft(p), removedR) &&
          tileryPanelTop(p) >= removedT - EPSILON &&
          tileryPanelBottom(p) <= removedB + EPSILON,
      ),
      range: (p) => ({ start: tileryPanelTop(p), end: tileryPanelBottom(p) }),
      target: { start: removedT, end: removedB },
      patch: (p) => ({ ...p.inset, left: removed.inset.left }),
    },
    {
      candidates: panels.filter(
        (p) =>
          p.id !== removed.id &&
          eq(tileryPanelRight(p), removedL) &&
          tileryPanelTop(p) >= removedT - EPSILON &&
          tileryPanelBottom(p) <= removedB + EPSILON,
      ),
      range: (p) => ({ start: tileryPanelTop(p), end: tileryPanelBottom(p) }),
      target: { start: removedT, end: removedB },
      patch: (p) => ({ ...p.inset, right: removed.inset.right }),
    },
    {
      candidates: panels.filter(
        (p) =>
          p.id !== removed.id &&
          eq(tileryPanelTop(p), removedB) &&
          tileryPanelLeft(p) >= removedL - EPSILON &&
          tileryPanelRight(p) <= removedR + EPSILON,
      ),
      range: (p) => ({ start: tileryPanelLeft(p), end: tileryPanelRight(p) }),
      target: { start: removedL, end: removedR },
      patch: (p) => ({ ...p.inset, top: removed.inset.top }),
    },
    {
      candidates: panels.filter(
        (p) =>
          p.id !== removed.id &&
          eq(tileryPanelBottom(p), removedT) &&
          tileryPanelLeft(p) >= removedL - EPSILON &&
          tileryPanelRight(p) <= removedR + EPSILON,
      ),
      range: (p) => ({ start: tileryPanelLeft(p), end: tileryPanelRight(p) }),
      target: { start: removedL, end: removedR },
      patch: (p) => ({ ...p.inset, bottom: removed.inset.bottom }),
    },
  ];

  for (const side of sides) {
    if (side.candidates.length === 0) continue;
    const cover = unionRanges(side.candidates.map(side.range));
    if (
      cover.length === 1 &&
      eq(cover[0]!.start, side.target.start) &&
      eq(cover[0]!.end, side.target.end)
    ) {
      return side.candidates.map((p) => ({ id: p.id, inset: side.patch(p) }));
    }
  }
  return [];
}

export function tileryRectsOverlap(a: TileryInset, b: TileryInset): boolean {
  const aL = a.left;
  const aR = 100 - a.right;
  const aT = a.top;
  const aB = 100 - a.bottom;
  const bL = b.left;
  const bR = 100 - b.right;
  const bT = b.top;
  const bB = 100 - b.bottom;
  return (
    aL < bR - EPSILON &&
    bL < aR - EPSILON &&
    aT < bB - EPSILON &&
    bT < aB - EPSILON
  );
}
