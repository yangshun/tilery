import type {
  TileryDockedLayoutInit,
  TileryFloatingPanelInit,
  TileryInitialLayout,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelId,
  TileryPanelInit,
  TileryPanelState,
  TileryTabId,
  TileryTabInit,
  TileryTabState,
} from '../types';
import type { TileryReducerTabInit } from './actions';
import { tileryWarnForConstraintDiagnostics } from './diagnostics';
import {
  tileryFloatingBoundsToInset,
  tileryFloatingZIndex,
  tileryNormalizeFloatingBounds,
  tileryNormalizePopoutPanelPlacement,
} from './floating';
import {
  tileryBehaviorFromNode,
  tileryMergeLayoutBehavior,
  tileryNormalizeLayoutBehavior,
} from './layout-behavior';
import { tilerySyncLayoutPanels } from './layout-tree';
import { tileryNormalizeTabBehavior } from './tab-behavior';

let idCounter = 0;

export function tileryNextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

type InitialStateBuildContext = {
  panels: Record<TileryPanelId, TileryPanelState>;
  tabs: Record<TileryTabId, TileryTabState>;
  floatingPanelOrder: TileryPanelId[];
  hasFullScreenPanel: boolean;
};

export function tileryCreateInitialState(
  initial: TileryInitialLayout,
): TileryLayoutState {
  const ctx: InitialStateBuildContext = {
    panels: {},
    tabs: {},
    floatingPanelOrder: [],
    hasFullScreenPanel: false,
  };
  const main = initial.type === 'root' ? initial.main : initial;
  const layout = buildInitialLayoutTree(main, ctx);
  if (initial.type === 'root') {
    initial.floating?.forEach((panel, index) =>
      buildInitialFloatingPanel(panel, ctx, index),
    );
  }
  const state: TileryLayoutState = {
    panels: ctx.panels,
    panelOrder: [],
    floatingPanelOrder: ctx.floatingPanelOrder,
    tabs: ctx.tabs,
    layout,
  };
  const next = tilerySyncLayoutPanels(state, layout);
  tileryWarnForConstraintDiagnostics(next);
  return next;
}

function buildInitialLayoutTree(
  init: TileryDockedLayoutInit,
  ctx: InitialStateBuildContext,
): TileryLayoutTree | null {
  if (init.type === 'empty') return null;

  if (init.type === 'panel') {
    const panelId = init.id ?? tileryNextId('p');
    const tabs: TileryTabId[] = [];
    for (const tabInit of init.tabs) {
      const tabId = tabInit.id ?? tileryNextId('t');
      const behavior = tileryNormalizeTabBehavior(tabInit);
      ctx.tabs[tabId] = {
        id: tabId,
        panelId,
        data: tabInit.data,
        ...behavior,
      };
      tabs.push(tabId);
    }
    const activeTabId =
      init.activeTabId && tabs.includes(init.activeTabId)
        ? init.activeTabId
        : (tabs[0] ?? null);
    const fullScreen = Boolean(init.fullScreen && !ctx.hasFullScreenPanel);
    if (fullScreen) ctx.hasFullScreenPanel = true;
    const behavior = tileryNormalizeLayoutBehavior(init);
    ctx.panels[panelId] = {
      id: panelId,
      kind: 'tiled',
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
      tabs,
      activeTabId,
      fullScreen,
      minSize: init.minSize,
      maxSize: init.maxSize,
    };
    return {
      kind: 'panel',
      panelId,
      size: init.size,
      defaultSize: init.defaultSize ?? init.size,
      ...behavior,
    };
  }

  if (init.type === 'group') {
    const behavior = tileryNormalizeLayoutBehavior(init);
    const children = init.children
      .map((child) => buildInitialLayoutTree(child, ctx))
      .filter((child): child is TileryLayoutTree => Boolean(child));
    if (children.length === 0) return null;
    if (children.length === 1) {
      return {
        ...children[0]!,
        size: init.size,
        defaultSize: init.defaultSize ?? init.size ?? children[0]!.defaultSize,
        ...tileryMergeLayoutBehavior(
          behavior,
          tileryBehaviorFromNode(children[0]!),
        ),
      };
    }
    return {
      kind: 'split',
      id: init.id ?? initialSplitId(init.direction, children),
      direction: init.direction,
      size: init.size,
      defaultSize: init.defaultSize ?? init.size,
      ...behavior,
      children,
    };
  }

  const unsupported = init as { type?: unknown };
  throw new Error(
    `Unsupported Tilery layout type: ${String(unsupported.type)}`,
  );
}

function buildInitialFloatingPanel(
  init: TileryFloatingPanelInit,
  ctx: InitialStateBuildContext,
  index: number,
) {
  const panelId = init.id ?? tileryNextId('p');
  const tabs: TileryTabId[] = [];
  for (const tabInit of init.tabs) {
    const tabId = tabInit.id ?? tileryNextId('t');
    const behavior = tileryNormalizeTabBehavior(tabInit);
    ctx.tabs[tabId] = {
      id: tabId,
      panelId,
      data: tabInit.data,
      ...behavior,
    };
    tabs.push(tabId);
  }
  const activeTabId =
    init.activeTabId && tabs.includes(init.activeTabId)
      ? init.activeTabId
      : (tabs[0] ?? null);
  const fullScreen = Boolean(init.fullScreen && !ctx.hasFullScreenPanel);
  if (fullScreen) ctx.hasFullScreenPanel = true;
  const bounds = tileryNormalizeFloatingBounds(init.bounds, {
    x: 18 + index * 4,
    y: 12 + index * 4,
    width: 46,
    height: 48,
  });
  const popout = tileryNormalizePopoutPanelPlacement(init.popout);
  ctx.panels[panelId] = {
    id: panelId,
    kind: 'floating',
    inset: tileryFloatingBoundsToInset(bounds),
    tabs,
    activeTabId,
    fullScreen,
    minSize: init.minSize,
    maxSize: init.maxSize,
    behavior: tileryNormalizeLayoutBehavior(init),
    floating: {
      bounds,
      zIndex: init.zIndex ?? tileryFloatingZIndex(index),
      ...(popout ? { popout } : {}),
    },
  };
  ctx.floatingPanelOrder.push(panelId);
}

function initialSplitId(
  direction: Extract<TileryLayoutTree, { kind: 'split' }>['direction'],
  children: TileryLayoutTree[],
): string {
  return `initial:${direction}:${children.map(layoutLeafSignature).join('|')}`;
}

function layoutLeafSignature(layout: TileryLayoutTree): string {
  if (layout.kind === 'panel') return layout.panelId;
  return `${layout.direction}(${layout.children.map(layoutLeafSignature).join(',')})`;
}

export function tileryPanelInitToReducerInit(init: TileryPanelInit): {
  id: TileryPanelId;
  tabs: TileryReducerTabInit[];
} {
  return {
    id: init.id ?? tileryNextId('p'),
    tabs: init.tabs.map(tileryTabInitToReducerInit),
  };
}

export function tileryTabInitToReducerInit(
  init: TileryTabInit,
): TileryReducerTabInit {
  const behavior = tileryNormalizeTabBehavior(init);
  return {
    id: init.id ?? tileryNextId('t'),
    data: init.data,
    ...behavior,
  };
}
