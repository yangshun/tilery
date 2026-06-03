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

export function tileryEdgePanelIdBySide(
  state: TileryLayoutState,
): Partial<Record<TileryEdge, TileryPanelId>> {
  const bySide: Partial<Record<TileryEdge, TileryPanelId>> = {};
  for (const panelId of tileryEdgePanelOrderFromState(state)) {
    const panel = state.panels[panelId];
    if (panel?.kind !== 'edge') continue;
    if (bySide[panel.edge.side]) continue;
    bySide[panel.edge.side] = panel.id;
  }
  return bySide;
}

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
    if (panel?.kind !== 'edge') continue;
    sizes[panel.edge.side] = clampPercent(panel.edge.size);
  }
  return sizes;
}

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

export function tileryNormalizeEdgePanelOrders(
  state: TileryLayoutState,
): TileryLayoutState {
  const edgePanelOrder = tileryEdgePanelOrderFromState(state);
  if (arraysEqual(state.edgePanelOrder ?? [], edgePanelOrder)) return state;
  return { ...state, edgePanelOrder };
}

export function tileryDefaultEdgePanelSize(side: TileryEdge): number {
  return side === 'top' || side === 'bottom' ? 28 : 24;
}

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
