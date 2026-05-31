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

type SplitNode = Extract<TileryLayoutTree, { kind: 'split' }>;

type BoundaryMatch = {
  node: SplitNode;
  rect: Rect;
  boundaryIndex: number;
  childRects: Rect[];
  childSizes: number[];
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
  return layout.children.flatMap((child) => tileryPanelOrderFromLayout(child));
}

export function tileryPanelOrderFromState(
  state: TileryLayoutState,
): TileryPanelId[] {
  const order = state.layout
    ? tileryPanelOrderFromLayout(state.layout)
    : state.panelOrder;
  return order.filter((id) => Boolean(state.panels[id]));
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
  const normalizedLayout = normalizeLayoutNode(layout);
  const insets = tileryDeriveLayoutInsets(normalizedLayout);
  let nextPanels = state.panels;
  for (const [panelId, inset] of Object.entries(insets)) {
    const panel = nextPanels[panelId];
    if (!panel) continue;
    if (insetsEqual(panel.inset, inset)) continue;
    if (nextPanels === state.panels) nextPanels = { ...state.panels };
    nextPanels[panelId] = { ...panel, inset };
  }
  const panelOrder = tileryPanelOrderFromLayout(normalizedLayout).filter((id) =>
    Boolean(nextPanels[id]),
  );
  if (
    nextPanels === state.panels &&
    arraysEqual(state.panelOrder, panelOrder) &&
    state.layout === normalizedLayout
  ) {
    return state;
  }
  return {
    ...state,
    panels: nextPanels,
    panelOrder,
    layout: normalizedLayout,
  };
}

export function tileryNormalizeLayoutState(
  state: TileryLayoutState,
): TileryLayoutState {
  if (state.layout) return tilerySyncLayoutPanels(state, state.layout);

  const panelOrder = state.panelOrder.filter((id) => Boolean(state.panels[id]));
  const layout = tileryBuildLayoutTreeFromPanels(
    panelOrder.map((id) => state.panels[id]!),
  );

  if (layout) {
    return tilerySyncLayoutPanels({ ...state, panelOrder, layout }, layout);
  }

  if (state.layout === null && arraysEqual(state.panelOrder, panelOrder)) {
    return state;
  }

  return { ...state, panelOrder, layout: null };
}

export function tilerySplitPanelInLayout(
  layout: TileryLayoutTree | null | undefined,
  panelId: TileryPanelId,
  newPanelId: TileryPanelId,
  direction: TileryDirection,
  requestedSize: number,
): TileryLayoutTree | null {
  if (!layout) return null;
  const size = clampPercent(requestedSize);
  const splitId = `split:${panelId}:${newPanelId}`;
  const panelLeaf: TileryLayoutTree = { kind: 'panel', panelId };
  const newLeaf: TileryLayoutTree = { kind: 'panel', panelId: newPanelId };
  const splitDirection =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';
  const children: TileryLayoutTree[] =
    direction === 'left' || direction === 'top'
      ? [
          { ...newLeaf, size },
          { ...panelLeaf, size: 100 - size },
        ]
      : [
          { ...panelLeaf, size: 100 - size },
          { ...newLeaf, size },
        ];
  const split = createSplit(splitId, splitDirection, children)!;
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
  walkSplitDividers(normalizeLayoutNode(layout), ROOT_RECT, dividers);
  return dividers;
}

export function tileryClampLayoutDividerPosition(
  layout: TileryLayoutTree | null | undefined,
  splitId: string,
  targetPosition: number,
  minSize: number,
  panels: Record<TileryPanelId, TileryPanelState> = {},
): number | null {
  const match = findBoundaryWithRect(layout, splitId, ROOT_RECT);
  if (!match) return null;
  const { node, rect, boundaryIndex, childSizes } = match;
  const span =
    node.direction === 'horizontal'
      ? rect.right - rect.left
      : rect.bottom - rect.top;
  const start = node.direction === 'horizontal' ? rect.left : rect.top;
  const pairStart = sum(childSizes.slice(0, boundaryIndex));
  const pairEnd =
    pairStart + childSizes[boundaryIndex]! + childSizes[boundaryIndex + 1]!;
  const current =
    start + (span * (pairStart + childSizes[boundaryIndex]!)) / 100;
  const before = node.children[boundaryIndex]!;
  const after = node.children[boundaryIndex + 1]!;
  const minBoundary = Math.max(
    pairStart + layoutChildMinSize(before, panels, minSize),
    pairEnd - layoutChildMaxSize(after, panels),
  );
  const maxBoundary = Math.min(
    pairStart + layoutChildMaxSize(before, panels),
    pairEnd - layoutChildMinSize(after, panels, minSize),
  );
  const min = start + (span * minBoundary) / 100;
  const max = start + (span * maxBoundary) / 100;
  if (min > max) return current;
  return Math.max(min, Math.min(max, targetPosition));
}

export function tileryResizeLayoutDivider(
  layout: TileryLayoutTree | null | undefined,
  splitId: string,
  newPosition: number,
): TileryLayoutTree | null | undefined {
  const match = findBoundaryWithRect(layout, splitId, ROOT_RECT);
  if (!match) return layout;
  const { node, rect, boundaryIndex, childSizes } = match;
  const span =
    node.direction === 'horizontal'
      ? rect.right - rect.left
      : rect.bottom - rect.top;
  const start = node.direction === 'horizontal' ? rect.left : rect.top;
  const targetPercent = ((newPosition - start) / span) * 100;
  const pairStart = sum(childSizes.slice(0, boundaryIndex));
  const pairEnd =
    pairStart + childSizes[boundaryIndex]! + childSizes[boundaryIndex + 1]!;
  const boundary = Math.max(pairStart, Math.min(pairEnd, targetPercent));
  const nextSizes = [...childSizes];
  nextSizes[boundaryIndex] = boundary - pairStart;
  nextSizes[boundaryIndex + 1] = pairEnd - boundary;

  return mapLayout(layout!, (candidate) => {
    if (candidate.kind !== 'split') return candidate;
    if (candidate.id !== node.id) return candidate;
    return {
      ...candidate,
      children: candidate.children.map((child, index) => ({
        ...child,
        size: nextSizes[index]!,
      })),
    };
  });
}

function buildTree(items: PanelItem[], bounds: Rect): TileryLayoutTree | null {
  if (items.length === 1) {
    return rectsEqual(items[0]!.rect, bounds)
      ? { kind: 'panel', panelId: items[0]!.id }
      : null;
  }

  return (
    buildAxisTree(items, bounds, 'horizontal') ??
    buildAxisTree(items, bounds, 'vertical')
  );
}

function buildAxisTree(
  items: PanelItem[],
  bounds: Rect,
  direction: 'horizontal' | 'vertical',
): TileryLayoutTree | null {
  const [min, max] =
    direction === 'horizontal'
      ? [bounds.left, bounds.right]
      : [bounds.top, bounds.bottom];
  const values =
    direction === 'horizontal'
      ? items.flatMap((item) => [item.rect.left, item.rect.right])
      : items.flatMap((item) => [item.rect.top, item.rect.bottom]);
  const cuts = splitCandidates(values, min, max).filter((cut) =>
    items.every((item) => !rectCrossesCut(item.rect, direction, cut)),
  );
  if (cuts.length === 0) return null;

  const boundaries = [min, ...cuts, max];
  const groups: PanelItem[][] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i]!;
    const end = boundaries[i + 1]!;
    const group = items.filter((item) =>
      rectInSegment(item.rect, direction, start, end),
    );
    if (group.length === 0) return null;
    groups.push(group);
  }

  const children: TileryLayoutTree[] = [];
  for (let i = 0; i < groups.length; i++) {
    const start = boundaries[i]!;
    const end = boundaries[i + 1]!;
    const childBounds =
      direction === 'horizontal'
        ? { ...bounds, left: start, right: end }
        : { ...bounds, top: start, bottom: end };
    const child = buildTree(groups[i]!, childBounds);
    if (!child) return null;
    const size = ((end - start) / (max - min)) * 100;
    children.push({ ...child, size });
  }

  return createSplit(splitIdFor(direction, groups), direction, children);
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
  const childRects = splitChildRects(rect, node);
  node.children.forEach((child, index) => {
    walkLayout(child, childRects[index]!, visitPanel);
  });
}

function walkSplitDividers(
  node: TileryLayoutTree,
  rect: Rect,
  out: TileryDivider[],
) {
  if (node.kind === 'panel') return;
  const childRects = splitChildRects(rect, node);
  for (let index = 0; index < node.children.length - 1; index++) {
    const before = node.children[index]!;
    const after = node.children[index + 1]!;
    const beforePanels = tileryPanelOrderFromLayout(before);
    const afterPanels = tileryPanelOrderFromLayout(after);
    const position =
      node.direction === 'horizontal'
        ? childRects[index]!.right
        : childRects[index]!.bottom;
    out.push(
      node.direction === 'horizontal'
        ? {
            id: `tree|${boundaryIdFor(node, index)}`,
            splitId: boundaryIdFor(node, index),
            orientation: 'vertical',
            position,
            start: rect.top,
            end: rect.bottom,
            beforePanels,
            afterPanels,
          }
        : {
            id: `tree|${boundaryIdFor(node, index)}`,
            splitId: boundaryIdFor(node, index),
            orientation: 'horizontal',
            position,
            start: rect.left,
            end: rect.right,
            beforePanels,
            afterPanels,
          },
    );
  }
  node.children.forEach((child, index) => {
    walkSplitDividers(child, childRects[index]!, out);
  });
}

function splitChildRects(rect: Rect, node: SplitNode): Rect[] {
  const sizes = childSizes(node.children);
  const totalSpan =
    node.direction === 'horizontal'
      ? rect.right - rect.left
      : rect.bottom - rect.top;
  let cursor = node.direction === 'horizontal' ? rect.left : rect.top;
  return node.children.map((_, index) => {
    const isLast = index === node.children.length - 1;
    const next = isLast
      ? node.direction === 'horizontal'
        ? rect.right
        : rect.bottom
      : cursor + (totalSpan * sizes[index]!) / 100;
    const child =
      node.direction === 'horizontal'
        ? { ...rect, left: cursor, right: next }
        : { ...rect, top: cursor, bottom: next };
    cursor = next;
    return child;
  });
}

function replacePanelLeaf(
  node: TileryLayoutTree,
  panelId: TileryPanelId,
  replacement: TileryLayoutTree,
): { node: TileryLayoutTree; changed: boolean } {
  if (node.kind === 'panel') {
    return node.panelId === panelId
      ? {
          node: { ...replacement, size: node.size },
          changed: true,
        }
      : { node, changed: false };
  }
  const children = normalizedChildren(node.children);
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!;
    if (child.kind === 'panel' && child.panelId === panelId) {
      const nextChildren = [
        ...children.slice(0, index),
        ...replacementForParent(replacement, child.size!, node.direction),
        ...children.slice(index + 1),
      ];
      return {
        node: createSplit(node.id, node.direction, nextChildren, node.size)!,
        changed: true,
      };
    }
    const replaced = replacePanelLeaf(child, panelId, replacement);
    if (!replaced.changed) continue;
    return {
      node: createSplit(
        node.id,
        node.direction,
        [
          ...children.slice(0, index),
          { ...replaced.node, size: child.size },
          ...children.slice(index + 1),
        ],
        node.size,
      )!,
      changed: true,
    };
  }
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
  const children = normalizedChildren(node.children);
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!;
    const result = removePanelLeaf(child, panelId);
    if (!result.removed) continue;
    const nextChildren = [
      ...children.slice(0, index),
      ...(result.node ? [{ ...result.node, size: child.size }] : []),
      ...children.slice(index + 1),
    ];
    return {
      node: createSplit(node.id, node.direction, nextChildren, node.size),
      removed: true,
    };
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
    children: node.children.map((child) => mapLayout(child, mapNode)),
  });
}

function findBoundaryWithRect(
  node: TileryLayoutTree | null | undefined,
  splitId: string,
  rect: Rect,
): BoundaryMatch | null {
  if (!node) return null;
  if (node.kind === 'panel') return null;
  const normalized = normalizeLayoutNode(node) as SplitNode;
  const childRects = splitChildRects(rect, normalized);
  const childSizeValues = childSizes(normalized.children);
  for (let index = 0; index < normalized.children.length - 1; index++) {
    if (boundaryIdFor(normalized, index) === splitId) {
      return {
        node: normalized,
        rect,
        boundaryIndex: index,
        childRects,
        childSizes: childSizeValues,
      };
    }
  }
  for (let index = 0; index < normalized.children.length; index++) {
    const found = findBoundaryWithRect(
      normalized.children[index],
      splitId,
      childRects[index]!,
    );
    if (found) return found;
  }
  return null;
}

function createSplit(
  id: string,
  direction: 'horizontal' | 'vertical',
  children: TileryLayoutTree[],
  size?: number,
): TileryLayoutTree | null {
  const flattened: TileryLayoutTree[] = [];
  for (const child of normalizedChildren(children)) {
    if (child.kind === 'split' && child.direction === direction) {
      for (const grandchild of normalizedChildren(child.children)) {
        flattened.push({
          ...grandchild,
          size: (child.size! * grandchild.size!) / 100,
        });
      }
    } else {
      flattened.push(child);
    }
  }

  const normalized = normalizedChildren(flattened);
  if (normalized.length === 0) return null;
  if (normalized.length === 1) {
    return { ...normalized[0]!, size };
  }
  return { kind: 'split', id, direction, size, children: normalized };
}

function normalizeLayoutNode(node: TileryLayoutTree): TileryLayoutTree {
  if (node.kind === 'panel') return node;
  const children = node.children.map(normalizeLayoutNode);
  const normalized =
    createSplit(node.id, node.direction, children, node.size) ?? node;
  return normalized.kind === 'split' &&
    normalized.id === node.id &&
    normalized.direction === node.direction &&
    normalized.size === node.size &&
    arraysEqual(normalized.children, node.children)
    ? node
    : normalized;
}

function sizeEqual(
  left: number | undefined,
  right: number | undefined,
): boolean {
  return left === right || (left != null && right != null && eq(left, right));
}

function normalizedChildren(children: TileryLayoutTree[]): TileryLayoutTree[] {
  const sizes = childSizes(children);
  return children.map((child, index) =>
    sizeEqual(child.size, sizes[index])
      ? child
      : {
          ...child,
          size: sizes[index]!,
        },
  );
}

function childSizes(children: TileryLayoutTree[]): number[] {
  if (children.length === 0) return [];
  const raw = children.map((child) =>
    typeof child.size === 'number' && Number.isFinite(child.size)
      ? Math.max(0, child.size)
      : null,
  );
  const provided = raw.reduce<number>(
    (total, value) => total + (value ?? 0),
    0,
  );
  const missing = raw.filter((value) => value == null).length;
  if (provided < 100 - EPSILON && missing > 0) {
    const fallback = (100 - provided) / missing;
    return raw.map((value) => value ?? fallback);
  }
  const withFallback = raw.map((value) => value ?? 1);
  const total = sum(withFallback);
  if (total <= EPSILON) return children.map(() => 100 / children.length);
  return withFallback.map((value) => (value / total) * 100);
}

function replacementForParent(
  replacement: TileryLayoutTree,
  size: number,
  parentDirection: 'horizontal' | 'vertical',
): TileryLayoutTree[] {
  if (
    replacement.kind === 'split' &&
    replacement.direction === parentDirection
  ) {
    return normalizedChildren(replacement.children).map((child) => ({
      ...child,
      size: (size * child.size!) / 100,
    }));
  }
  return [{ ...replacement, size }];
}

function boundaryIdFor(split: SplitNode, index: number): string {
  return `${split.id}#${index}`;
}

function layoutChildMinSize(
  child: TileryLayoutTree,
  panels: Record<TileryPanelId, TileryPanelState>,
  fallback: number,
): number {
  if (child.kind !== 'panel') return Math.max(0, fallback);
  return finiteSize(panels[child.panelId]?.minSize) ?? Math.max(0, fallback);
}

function layoutChildMaxSize(
  child: TileryLayoutTree,
  panels: Record<TileryPanelId, TileryPanelState>,
): number {
  if (child.kind !== 'panel') return Infinity;
  return finiteSize(panels[child.panelId]?.maxSize) ?? Infinity;
}

function finiteSize(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : null;
}

function rectCrossesCut(
  rect: Rect,
  direction: 'horizontal' | 'vertical',
  cut: number,
): boolean {
  return direction === 'horizontal'
    ? rect.left < cut - EPSILON && rect.right > cut + EPSILON
    : rect.top < cut - EPSILON && rect.bottom > cut + EPSILON;
}

function rectInSegment(
  rect: Rect,
  direction: 'horizontal' | 'vertical',
  start: number,
  end: number,
): boolean {
  return direction === 'horizontal'
    ? rect.left >= start - EPSILON && rect.right <= end + EPSILON
    : rect.top >= start - EPSILON && rect.bottom <= end + EPSILON;
}

function splitCandidates(values: number[], min: number, max: number): number[] {
  return [...new Set(values.map((value) => value.toFixed(4)))]
    .map(Number)
    .filter((value) => value > min + EPSILON && value < max - EPSILON)
    .sort((a, b) => a - b);
}

function splitIdFor(
  direction: 'horizontal' | 'vertical',
  groups: PanelItem[][],
): string {
  return `${direction}:${groups
    .map((group) =>
      group
        .map((item) => item.id)
        .sort()
        .join(','),
    )
    .join('|')}`;
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return (
    eq(a.left, b.left) &&
    eq(a.right, b.right) &&
    eq(a.top, b.top) &&
    eq(a.bottom, b.bottom)
  );
}

function insetsEqual(a: TileryInset, b: TileryInset): boolean {
  return (
    eq(a.left, b.left) &&
    eq(a.right, b.right) &&
    eq(a.top, b.top) &&
    eq(a.bottom, b.bottom)
  );
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
