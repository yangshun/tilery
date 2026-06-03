/**
 * Pinned edge-panel ordering, sizing, and clamping.
 */
import type {
  TileryEdge,
  TileryEdgePanelState,
  TileryLayoutState,
  TileryPanelId,
  TileryPanelState,
  TilerySize,
  TilerySizeResolutionContext,
} from '../types';
import { tileryAxisPixels, tileryResolveSizePercent } from './size';

const EDGE_ORDER: TileryEdge[] = ['left', 'right', 'top', 'bottom'];
const DEFAULT_MIN_SIZE = 10;

/**
 * Returns a stable ordered list of edge-panel IDs from `state`, filtering
 * stale entries from `edgePanelOrder` and appending any edge panels not yet
 * tracked, sorted by canonical side order (left → right → top → bottom).
 */
export function tileryEdgePanelOrderFromState(
  state: TileryLayoutState,
): TileryPanelId[] {
  const ordered = (state.edgePanelOrder ?? []).filter(
    (id) => state.panels[id]?.kind === 'edge',
  );
  const seen = new Set(ordered);
  const missing = Object.values(state.panels)
    .filter((panel): panel is TileryEdgePanelState => {
      return (
        panel.kind === 'edge' &&
        !seen.has(panel.id) &&
        !ordered.some((id) => {
          const orderedPanel = state.panels[id];
          return (
            orderedPanel?.kind === 'edge' &&
            orderedPanel.edge.side === panel.edge.side
          );
        })
      );
    })
    .sort(
      (a, b) =>
        EDGE_ORDER.indexOf(a.edge.side) - EDGE_ORDER.indexOf(b.edge.side),
    )
    .map((panel) => panel.id);
  return [...ordered, ...missing];
}

/**
 * Returns a map from each occupied edge side to the first panel ID assigned
 * to that side according to the canonical edge order.
 */
export function tileryEdgePanelIdBySide(
  state: TileryLayoutState,
): Partial<Record<TileryEdge, TileryPanelId>> {
  const bySide: Partial<Record<TileryEdge, TileryPanelId>> = {};
  for (const panelId of tileryEdgePanelOrderFromState(state)) {
    const panel = state.panels[panelId];
    /* v8 ignore next 2 -- the order helper yields exactly one edge panel per side. */
    if (panel?.kind !== 'edge') continue;
    if (bySide[panel.edge.side]) continue;
    bySide[panel.edge.side] = panel.id;
  }
  return bySide;
}

/**
 * Computes the current clamped percentage size for each edge side, returning
 * `0` for any side that has no active edge panel.
 */
export function tileryEdgePanelSizes(
  state: TileryLayoutState,
): Record<TileryEdge, number> {
  const sizes: Record<TileryEdge, number> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };
  for (const panelId of tileryEdgePanelOrderFromState(state)) {
    const panel = state.panels[panelId];
    /* v8 ignore next -- the order helper yields only edge panels. */
    if (panel?.kind !== 'edge') continue;
    sizes[panel.edge.side] = clampPercent(panel.edge.size);
  }
  return sizes;
}

/**
 * Resizes an edge panel to `size` after clamping it against the panel's
 * min/max constraints and the space needed by the opposite edge panel.
 * Returns `state` unchanged when the panel is not edge-kind, is not
 * resizable, or the clamped size equals the current size.
 */
export function tilerySetEdgePanelSize(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  size: number,
  minSize: TilerySize = DEFAULT_MIN_SIZE,
  sizeContext?: TilerySizeResolutionContext,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'edge') return state;
  if (!panel.behavior.resizable) return state;
  const nextSize = tileryClampEdgePanelSize(
    state,
    panelId,
    size,
    minSize,
    sizeContext,
  );
  if (Math.abs(nextSize - panel.edge.size) < 0.0001) return state;
  return {
    ...state,
    panels: {
      ...state.panels,
      [panelId]: {
        ...panel,
        inset: edgeInset(panel.edge.side, nextSize),
        edge: { ...panel.edge, size: nextSize },
      },
    },
  };
}

/**
 * Clamps `targetSize` to the valid range for an edge panel: at least
 * `minSize`, at most the panel's `maxSize` and the available space after
 * reserving room for the opposite edge and the center minimum. Returns the
 * panel's current size unchanged when `min > max`.
 */
export function tileryClampEdgePanelSize(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  targetSize: number,
  minSize: TilerySize = DEFAULT_MIN_SIZE,
  sizeContext?: TilerySizeResolutionContext,
): number {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'edge') return clampPercent(targetSize);
  const side = panel.edge.side;
  const horizontal = side === 'left' || side === 'right';
  const axisPixels = tileryAxisPixels(
    sizeContext,
    horizontal ? 'horizontal' : 'vertical',
  );
  const min = panelMinSize(panel, minSize, axisPixels);
  const max = panelMaxSize(panel, axisPixels);
  const opposite = state.panels[oppositeEdgePanelId(state, side) ?? ''];
  const oppositeSize = opposite?.kind === 'edge' ? opposite.edge.size : 0;
  const centerMin =
    tileryResolveSizePercent(minSize, axisPixels) ?? DEFAULT_MIN_SIZE;
  const availableMax = Math.max(0, 100 - oppositeSize - centerMin);
  const upper = Math.min(max, availableMax);
  if (min > upper) return panel.edge.size;
  return Math.max(min, Math.min(upper, clampPercent(targetSize)));
}

/**
 * Ensures `state.edgePanelOrder` matches the canonical order derived from
 * `tileryEdgePanelOrderFromState`. Returns `state` unchanged when the order
 * is already consistent.
 */
export function tileryNormalizeEdgePanelOrders(
  state: TileryLayoutState,
): TileryLayoutState {
  const edgePanelOrder = tileryEdgePanelOrderFromState(state);
  if (arraysEqual(state.edgePanelOrder ?? [], edgePanelOrder)) return state;
  return { ...state, edgePanelOrder };
}

/**
 * Returns the default percentage size for a newly created edge panel:
 * 28 % for top/bottom and 24 % for left/right.
 */
export function tileryDefaultEdgePanelSize(side: TileryEdge): number {
  return side === 'top' || side === 'bottom' ? 28 : 24;
}

/**
 * Computes the four-sided inset for an edge panel given its side and
 * percentage size, placing the occupying edge at zero and pushing the
 * opposite side inward by `100 - size`.
 */
export function tileryEdgeInset(
  side: TileryEdge,
  size: number,
): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  return edgeInset(side, size);
}

function oppositeEdgePanelId(
  state: TileryLayoutState,
  side: TileryEdge,
): TileryPanelId | undefined {
  const bySide = tileryEdgePanelIdBySide(state);
  if (side === 'left') return bySide.right;
  if (side === 'right') return bySide.left;
  if (side === 'top') return bySide.bottom;
  return bySide.top;
}

function panelMinSize(
  panel: TileryPanelState,
  fallback: TilerySize,
  axisPixels: number | undefined,
): number {
  return (
    tileryResolveSizePercent(panel.minSize ?? fallback, axisPixels) ??
    DEFAULT_MIN_SIZE
  );
}

function panelMaxSize(
  panel: TileryPanelState,
  axisPixels: number | undefined,
): number {
  return tileryResolveSizePercent(panel.maxSize, axisPixels) ?? 100;
}

function edgeInset(side: TileryEdge, size: number) {
  const clamped = clampPercent(size);
  if (side === 'left') {
    return { top: 0, right: 100 - clamped, bottom: 0, left: 0 };
  }
  if (side === 'right') {
    return { top: 0, right: 0, bottom: 0, left: 100 - clamped };
  }
  if (side === 'top') {
    return { top: 0, right: 0, bottom: 100 - clamped, left: 0 };
  }
  return { top: 100 - clamped, right: 0, bottom: 0, left: 0 };
}

function clampPercent(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}
