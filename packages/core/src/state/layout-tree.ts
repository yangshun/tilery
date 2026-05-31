import type {
  TileryDirection,
  TileryDivider,
  TileryInset,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelId,
  TileryPanelState,
} from '../types';

const EPSILON = 0.0001;
const ROOT_RECT: Rect = { left: 0, right: 100, top: 0, bottom: 100 };

type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type PanelItem = {
  id: TileryPanelId;
  rect: Rect;
};

const eq = (a: number, b: number) => Math.abs(a - b) < EPSILON;

export function tileryInsetToRect(inset: TileryInset): Rect {
  return {
    left: inset.left,
    right: 100 - inset.right,
    top: inset.top,
    bottom: 100 - inset.bottom,
  };
}

export function tileryRectToInset(rect: Rect): TileryInset {
  return {
    top: rect.top,
    right: 100 - rect.right,
    bottom: 100 - rect.bottom,
    left: rect.left,
  };
}

export function tileryBuildLayoutTreeFromPanels(
  panels: TileryPanelState[],
): TileryLayoutTree | null {
  if (panels.length === 0) return null;
  const items = panels.map((panel) => ({
    id: panel.id,
    rect: tileryInsetToRect(panel.inset),
  }));
  return buildTree(items, ROOT_RECT);
}

export function tileryPanelOrderFromLayout(
  layout: TileryLayoutTree | null | undefined,
): TileryPanelId[] {
  if (!layout) return [];
  if (layout.kind === 'panel') return [layout.panelId];
  return [
    ...tileryPanelOrderFromLayout(layout.first),
    ...tileryPanelOrderFromLayout(layout.second),
  ];
}

export function tileryDeriveLayoutInsets(
  layout: TileryLayoutTree | null | undefined,
): Record<TileryPanelId, TileryInset> {
  const out: Record<TileryPanelId, TileryInset> = {};
  if (!layout) return out;
  walkLayout(layout, ROOT_RECT, (panelId, rect) => {
    out[panelId] = tileryRectToInset(rect);
  });
  return out;
}

export function tilerySyncLayoutPanels(
  state: TileryLayoutState,
  layout: TileryLayoutTree | null | undefined = state.layout,
): TileryLayoutState {
  if (!layout) return { ...state, layout: layout ?? null };
  const insets = tileryDeriveLayoutInsets(layout);
  const nextPanels = { ...state.panels };
  for (const [panelId, inset] of Object.entries(insets)) {
    const panel = nextPanels[panelId];
    if (panel) nextPanels[panelId] = { ...panel, inset };
  }
  return {
    ...state,
    panels: nextPanels,
    panelOrder: tileryPanelOrderFromLayout(layout).filter((id) =>
      Boolean(nextPanels[id]),
    ),
    layout,
  };
}

export function tilerySplitPanelInLayout(
  layout: TileryLayoutTree | null | undefined,
  panelId: TileryPanelId,
  newPanelId: TileryPanelId,
  direction: TileryDirection,
  sizePercent: number,
): TileryLayoutTree | null {
  if (!layout) return null;
  const size = clampPercent(sizePercent);
  const splitId = `split:${panelId}:${newPanelId}`;
  const panelLeaf: TileryLayoutTree = { kind: 'panel', panelId };
  const newLeaf: TileryLayoutTree = { kind: 'panel', panelId: newPanelId };
  const split: TileryLayoutTree =
    direction === 'left'
      ? {
          kind: 'split',
          id: splitId,
          direction: 'horizontal',
          sizePercent: size,
          first: newLeaf,
          second: panelLeaf,
        }
      : direction === 'right'
        ? {
            kind: 'split',
            id: splitId,
            direction: 'horizontal',
            sizePercent: 100 - size,
            first: panelLeaf,
            second: newLeaf,
          }
        : direction === 'top'
          ? {
              kind: 'split',
              id: splitId,
              direction: 'vertical',
              sizePercent: size,
              first: newLeaf,
              second: panelLeaf,
            }
          : {
              kind: 'split',
              id: splitId,
              direction: 'vertical',
              sizePercent: 100 - size,
              first: panelLeaf,
              second: newLeaf,
            };
  const next = replacePanelLeaf(layout, panelId, split);
  return next.changed ? next.node : null;
}

export function tileryRemovePanelFromLayout(
  layout: TileryLayoutTree | null | undefined,
  panelId: TileryPanelId,
): TileryLayoutTree | null | undefined {
  if (!layout) return layout;
  const result = removePanelLeaf(layout, panelId);
  return result.removed ? result.node : layout;
}

export function tilerySwapPanelsInLayout(
  layout: TileryLayoutTree | null | undefined,
  panelA: TileryPanelId,
  panelB: TileryPanelId,
): TileryLayoutTree | null | undefined {
  if (!layout) return layout;
  return mapLayout(layout, (node) => {
    if (node.kind !== 'panel') return node;
    if (node.panelId === panelA) return { ...node, panelId: panelB };
    if (node.panelId === panelB) return { ...node, panelId: panelA };
    return node;
  });
}

export function tileryDeriveLayoutDividers(
  layout: TileryLayoutTree | null | undefined,
): TileryDivider[] {
  const dividers: TileryDivider[] = [];
  if (!layout) return dividers;
  walkSplitDividers(layout, ROOT_RECT, dividers);
  return dividers;
}

export function tileryClampLayoutDividerPosition(
  layout: TileryLayoutTree | null | undefined,
  splitId: string,
  targetPosition: number,
  minSizePercent: number,
): number | null {
  const match = findSplitWithRect(layout, splitId, ROOT_RECT);
  if (!match) return null;
  const { node, rect } = match;
  const span =
    node.direction === 'horizontal'
      ? rect.right - rect.left
      : rect.bottom - rect.top;
  const minSize = (span * minSizePercent) / 100;
  const min =
    node.direction === 'horizontal' ? rect.left + minSize : rect.top + minSize;
  const max =
    node.direction === 'horizontal'
      ? rect.right - minSize
      : rect.bottom - minSize;
  const current =
    node.direction === 'horizontal'
      ? rect.left + (span * node.sizePercent) / 100
      : rect.top + (span * node.sizePercent) / 100;
  if (min > max) return current;
  return Math.max(min, Math.min(max, targetPosition));
}

export function tileryResizeLayoutDivider(
  layout: TileryLayoutTree | null | undefined,
  splitId: string,
  newPosition: number,
): TileryLayoutTree | null | undefined {
  const match = findSplitWithRect(layout, splitId, ROOT_RECT);
  if (!match) return layout;
  const { node, rect } = match;
  const span =
    node.direction === 'horizontal'
      ? rect.right - rect.left
      : rect.bottom - rect.top;
  const start = node.direction === 'horizontal' ? rect.left : rect.top;
  const sizePercent =
    span <= EPSILON ? node.sizePercent : ((newPosition - start) / span) * 100;
  return mapLayout(layout!, (candidate) =>
    candidate.kind === 'split' && candidate.id === splitId
      ? { ...candidate, sizePercent: clampPercent(sizePercent) }
      : candidate,
  );
}

function buildTree(items: PanelItem[], bounds: Rect): TileryLayoutTree | null {
  if (items.length === 1) {
    return rectsEqual(items[0]!.rect, bounds)
      ? { kind: 'panel', panelId: items[0]!.id }
      : null;
  }

  const xCandidates = splitCandidates(
    items.flatMap((item) => [item.rect.left, item.rect.right]),
    bounds.left,
    bounds.right,
  );
  for (const x of xCandidates) {
    const left: PanelItem[] = [];
    const right: PanelItem[] = [];
    let crosses = false;
    for (const item of items) {
      if (item.rect.right <= x + EPSILON) left.push(item);
      else if (item.rect.left >= x - EPSILON) right.push(item);
      else {
        crosses = true;
        break;
      }
    }
    if (crosses || left.length === 0 || right.length === 0) continue;
    const first = buildTree(left, { ...bounds, right: x });
    const second = buildTree(right, { ...bounds, left: x });
    if (first && second) {
      return {
        kind: 'split',
        id: splitIdFor('horizontal', left, right),
        direction: 'horizontal',
        sizePercent: ((x - bounds.left) / (bounds.right - bounds.left)) * 100,
        first,
        second,
      };
    }
  }

  const yCandidates = splitCandidates(
    items.flatMap((item) => [item.rect.top, item.rect.bottom]),
    bounds.top,
    bounds.bottom,
  );
  for (const y of yCandidates) {
    const top: PanelItem[] = [];
    const bottom: PanelItem[] = [];
    let crosses = false;
    for (const item of items) {
      if (item.rect.bottom <= y + EPSILON) top.push(item);
      else if (item.rect.top >= y - EPSILON) bottom.push(item);
      else {
        crosses = true;
        break;
      }
    }
    if (crosses || top.length === 0 || bottom.length === 0) continue;
    const first = buildTree(top, { ...bounds, bottom: y });
    const second = buildTree(bottom, { ...bounds, top: y });
    if (first && second) {
      return {
        kind: 'split',
        id: splitIdFor('vertical', top, bottom),
        direction: 'vertical',
        sizePercent: ((y - bounds.top) / (bounds.bottom - bounds.top)) * 100,
        first,
        second,
      };
    }
  }

  return null;
}

function walkLayout(
  node: TileryLayoutTree,
  rect: Rect,
  visitPanel: (panelId: TileryPanelId, rect: Rect) => void,
) {
  if (node.kind === 'panel') {
    visitPanel(node.panelId, rect);
    return;
  }
  const { first, second } = splitRect(rect, node);
  walkLayout(node.first, first, visitPanel);
  walkLayout(node.second, second, visitPanel);
}

function walkSplitDividers(
  node: TileryLayoutTree,
  rect: Rect,
  out: TileryDivider[],
) {
  if (node.kind === 'panel') return;
  const { first, second } = splitRect(rect, node);
  const firstPanels = tileryPanelOrderFromLayout(node.first);
  const secondPanels = tileryPanelOrderFromLayout(node.second);
  out.push(
    node.direction === 'horizontal'
      ? {
          id: `tree|${node.id}`,
          splitId: node.id,
          orientation: 'vertical',
          position: first.right,
          start: rect.top,
          end: rect.bottom,
          beforePanels: firstPanels,
          afterPanels: secondPanels,
        }
      : {
          id: `tree|${node.id}`,
          splitId: node.id,
          orientation: 'horizontal',
          position: first.bottom,
          start: rect.left,
          end: rect.right,
          beforePanels: firstPanels,
          afterPanels: secondPanels,
        },
  );
  walkSplitDividers(node.first, first, out);
  walkSplitDividers(node.second, second, out);
}

function splitRect(
  rect: Rect,
  node: Extract<TileryLayoutTree, { kind: 'split' }>,
): { first: Rect; second: Rect } {
  const size = clampPercent(node.sizePercent);
  if (node.direction === 'horizontal') {
    const x = rect.left + ((rect.right - rect.left) * size) / 100;
    return {
      first: { ...rect, right: x },
      second: { ...rect, left: x },
    };
  }
  const y = rect.top + ((rect.bottom - rect.top) * size) / 100;
  return {
    first: { ...rect, bottom: y },
    second: { ...rect, top: y },
  };
}

function replacePanelLeaf(
  node: TileryLayoutTree,
  panelId: TileryPanelId,
  replacement: TileryLayoutTree,
): { node: TileryLayoutTree; changed: boolean } {
  if (node.kind === 'panel') {
    return node.panelId === panelId
      ? { node: replacement, changed: true }
      : { node, changed: false };
  }
  const first = replacePanelLeaf(node.first, panelId, replacement);
  if (first.changed)
    return { node: { ...node, first: first.node }, changed: true };
  const second = replacePanelLeaf(node.second, panelId, replacement);
  if (second.changed)
    return { node: { ...node, second: second.node }, changed: true };
  return { node, changed: false };
}

function removePanelLeaf(
  node: TileryLayoutTree,
  panelId: TileryPanelId,
): { node: TileryLayoutTree | null; removed: boolean } {
  if (node.kind === 'panel') {
    return node.panelId === panelId
      ? { node: null, removed: true }
      : { node, removed: false };
  }
  const first = removePanelLeaf(node.first, panelId);
  if (first.removed) {
    if (!first.node) return { node: node.second, removed: true };
    return { node: { ...node, first: first.node }, removed: true };
  }
  const second = removePanelLeaf(node.second, panelId);
  if (second.removed) {
    if (!second.node) return { node: node.first, removed: true };
    return { node: { ...node, second: second.node }, removed: true };
  }
  return { node, removed: false };
}

function mapLayout(
  node: TileryLayoutTree,
  mapNode: (node: TileryLayoutTree) => TileryLayoutTree,
): TileryLayoutTree {
  if (node.kind === 'panel') return mapNode(node);
  return mapNode({
    ...node,
    first: mapLayout(node.first, mapNode),
    second: mapLayout(node.second, mapNode),
  });
}

function findSplitWithRect(
  node: TileryLayoutTree | null | undefined,
  splitId: string,
  rect: Rect,
): { node: Extract<TileryLayoutTree, { kind: 'split' }>; rect: Rect } | null {
  if (!node) return null;
  if (node.kind === 'panel') return null;
  if (node.id === splitId) return { node, rect };
  const { first, second } = splitRect(rect, node);
  return (
    findSplitWithRect(node.first, splitId, first) ??
    findSplitWithRect(node.second, splitId, second)
  );
}

function splitCandidates(values: number[], min: number, max: number): number[] {
  return [...new Set(values.map((value) => value.toFixed(4)))]
    .map(Number)
    .filter((value) => value > min + EPSILON && value < max - EPSILON)
    .sort((a, b) => a - b);
}

function splitIdFor(
  direction: 'horizontal' | 'vertical',
  first: PanelItem[],
  second: PanelItem[],
): string {
  const a = first
    .map((item) => item.id)
    .sort()
    .join(',');
  const b = second
    .map((item) => item.id)
    .sort()
    .join(',');
  return `${direction}:${a}|${b}`;
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return (
    eq(a.left, b.left) &&
    eq(a.right, b.right) &&
    eq(a.top, b.top) &&
    eq(a.bottom, b.bottom)
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}
