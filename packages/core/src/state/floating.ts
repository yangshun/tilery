import type {
  TileryDockPanelTarget,
  TileryFloatingPanelBounds,
  TileryFloatingPanelBoundsInit,
  TileryFloatingResizeEdge,
  TileryLayoutBehavior,
  TileryLayoutBehaviorConfig,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelId,
  TileryPanelState,
  TileryPopoutPanelConfig,
  TileryPopoutPanelOptions,
  TileryPopoutPanelPlacement,
  TileryPopoutWindowBounds,
  TileryPopoutWindowBoundsInit,
  TilerySizeResolutionContext,
  TileryTabId,
} from '../types';
import { tileryEdgePanelOrderFromState } from './edges';
import {
  tileryFindRemovalFillers,
  tilerySplitFitsPanelConstraints,
  tilerySplitInset,
} from './layout-math';
import {
  tileryFloatingPanelOrderFromState,
  tileryPanelOrderFromState,
  tileryRemovePanelFromLayout,
  tilerySplitPanelInLayout,
  tilerySyncLayoutPanels,
} from './layout-tree';
import {
  tileryLockedLayoutBehavior,
  tileryNormalizeLayoutBehavior,
  tileryPanelBehaviorFromState,
} from './layout-behavior';
import { tileryRemovePanelAndFill } from './panels';

export function tileryFloatPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
  behaviorConfig?: TileryLayoutBehaviorConfig,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel) return state;
  if (panel.kind === 'floating') {
    const bounds = boundsInit
      ? tileryNormalizeFloatingBounds(boundsInit, panel.floating.bounds)
      : panel.floating.bounds;
    const behavior = tileryMergeFloatingBehavior(
      panel.behavior,
      behaviorConfig,
    );
    const changed =
      !tileryFloatingBoundsEqual(bounds, panel.floating.bounds) ||
      Boolean(panel.floating.popout) ||
      !tileryLayoutBehaviorEqual(panel.behavior, behavior);
    const next = changed
      ? {
          ...state,
          panels: {
            ...state.panels,
            [panelId]: {
              ...panel,
              inset: tileryFloatingBoundsToInset(bounds),
              floating: {
                bounds,
                zIndex: panel.floating.zIndex,
              },
              behavior,
            },
          },
        }
      : state;
    return tileryFocusFloatingPanel(next, panelId);
  }

  const bounds = tileryNormalizeFloatingBounds(
    boundsInit,
    tileryDefaultFloatingBounds(panel),
  );
  const floatingPanel: TileryPanelState = {
    id: panel.id,
    kind: 'floating',
    inset: tileryFloatingBoundsToInset(bounds),
    tabs: panel.tabs,
    activeTabId: panel.activeTabId,
    fullScreen: false,
    minSize: panel.minSize,
    maxSize: panel.maxSize,
    behavior: tileryMergeFloatingBehavior(
      tileryPanelBehaviorFromState(state, panelId),
      behaviorConfig,
    ),
    floating: {
      bounds,
      zIndex: tileryNextFloatingZIndex(state),
    },
  };
  let nextPanels: Record<TileryPanelId, TileryPanelState> = {
    ...state.panels,
    [panelId]: floatingPanel,
  };
  const floatingPanelOrder = [
    ...tileryFloatingPanelOrderFromState(state).filter((id) => id !== panelId),
    panelId,
  ];

  if (panel.kind === 'edge') {
    return tileryFocusFloatingPanel(
      {
        ...state,
        panels: nextPanels,
        edgePanelOrder: tileryEdgePanelOrderFromState(state).filter(
          (id) => id !== panelId,
        ),
        floatingPanelOrder,
      },
      panelId,
    );
  }

  if (state.layout) {
    const layout = tileryRemovePanelFromLayout(state.layout, panelId) ?? null;
    return tileryFocusFloatingPanel(
      tilerySyncLayoutPanels(
        {
          ...state,
          panels: nextPanels,
          panelOrder: tileryPanelOrderFromState(state).filter(
            (id) => id !== panelId,
          ),
          floatingPanelOrder,
          layout,
        },
        layout,
      ),
      panelId,
    );
  }

  const currentOrder = tileryPanelOrderFromState(state);
  const otherPanels = currentOrder
    .map((id) => state.panels[id])
    .filter(
      (item): item is TileryPanelState =>
        Boolean(item) && item.kind === 'tiled' && item.id !== panelId,
    );
  /* v8 ignore next 8 -- filler ids are derived from existing tiled panels. */
  for (const filler of tileryFindRemovalFillers(otherPanels, panel)) {
    const current = nextPanels[filler.id];
    if (!current) continue;
    nextPanels = {
      ...nextPanels,
      [filler.id]: { ...current, inset: filler.inset },
    };
  }

  return tileryFocusFloatingPanel(
    {
      ...state,
      panels: nextPanels,
      panelOrder: currentOrder.filter((id) => id !== panelId),
      floatingPanelOrder,
      layout: null,
    },
    panelId,
  );
}

export function tileryPopoutPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  opts?: TileryPopoutPanelOptions,
): TileryLayoutState {
  const floated = tileryFloatPanel(state, panelId, opts?.floatingBounds, opts);
  const panel = floated.panels[panelId];
  if (!panel || panel.kind !== 'floating') return floated;
  const popout = tileryNormalizePopoutPanelPlacement(
    opts?.windowBounds ? { windowBounds: opts.windowBounds } : true,
  );
  return tileryFocusFloatingPanel(
    {
      ...floated,
      panels: {
        ...floated.panels,
        [panelId]: {
          ...panel,
          floating: {
            ...panel.floating,
            popout,
          },
        },
      },
    },
    panelId,
  );
}

export function tileryReturnPanelToFloating(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  if (!panel.floating.popout && !boundsInit) return state;
  const bounds = boundsInit
    ? tileryNormalizeFloatingBounds(boundsInit, panel.floating.bounds)
    : panel.floating.bounds;
  return tileryFocusFloatingPanel(
    {
      ...state,
      panels: {
        ...state.panels,
        [panelId]: {
          ...panel,
          inset: tileryFloatingBoundsToInset(bounds),
          floating: {
            bounds,
            zIndex: panel.floating.zIndex,
          },
        },
      },
    },
    panelId,
  );
}

export function tileryFloatTab(
  state: TileryLayoutState,
  tabId: TileryTabId,
  newPanelId: TileryPanelId,
  boundsInit?: TileryFloatingPanelBoundsInit,
  behaviorConfig?: TileryLayoutBehaviorConfig,
): TileryLayoutState {
  const tab = state.tabs[tabId];
  if (!tab) return state;
  if (!tab.draggable) return state;
  if (state.panels[newPanelId]) return state;
  const sourcePanel = state.panels[tab.panelId];
  if (!sourcePanel) return state;
  if (!tileryPanelBehaviorFromState(state, sourcePanel.id).draggable) {
    return state;
  }

  const bounds = tileryNormalizeFloatingBounds(
    boundsInit,
    sourcePanel.kind === 'floating'
      ? sourcePanel.floating.bounds
      : tileryDefaultFloatingBounds(sourcePanel),
  );
  const newPanel: TileryPanelState = {
    id: newPanelId,
    kind: 'floating',
    inset: tileryFloatingBoundsToInset(bounds),
    tabs: [tabId],
    activeTabId: tabId,
    fullScreen: false,
    behavior: tileryNormalizeLayoutBehavior(behaviorConfig),
    floating: {
      bounds,
      zIndex: tileryNextFloatingZIndex(state),
    },
  };
  const sourceTabs = sourcePanel.tabs.filter((id) => id !== tabId);
  const wasActiveInSource = sourcePanel.activeTabId === tabId;
  let next: TileryLayoutState = {
    ...state,
    panels: {
      ...state.panels,
      [newPanelId]: newPanel,
    },
    tabs: {
      ...state.tabs,
      [tabId]: {
        ...tab,
        panelId: newPanelId,
      },
    },
    floatingPanelOrder: [
      ...tileryFloatingPanelOrderFromState(state).filter(
        (id) => id !== newPanelId,
      ),
      newPanelId,
    ],
  };

  if (sourceTabs.length === 0) {
    next = tileryRemovePanelAndFill(next, {
      ...sourcePanel,
      tabs: [],
      activeTabId: null,
    });
  } else {
    next = {
      ...next,
      panels: {
        ...next.panels,
        [sourcePanel.id]: {
          ...sourcePanel,
          tabs: sourceTabs,
          activeTabId: wasActiveInSource
            ? (sourceTabs[
                Math.min(sourceTabs.length - 1, sourcePanel.tabs.indexOf(tabId))
              ] ?? null)
            : sourcePanel.activeTabId,
        },
      },
    };
  }

  return tileryFocusFloatingPanel(next, newPanelId);
}

export function tileryPopoutTab(
  state: TileryLayoutState,
  tabId: TileryTabId,
  newPanelId: TileryPanelId,
  opts?: TileryPopoutPanelOptions,
): TileryLayoutState {
  const floated = tileryFloatTab(
    state,
    tabId,
    newPanelId,
    opts?.floatingBounds,
    opts,
  );
  if (floated === state) return state;
  const panel = floated.panels[newPanelId];
  /* v8 ignore next -- floatTab just created this floating panel. */
  if (!panel || panel.kind !== 'floating') return floated;
  const popout = tileryNormalizePopoutPanelPlacement({
    windowBounds: opts?.windowBounds,
  });
  return tileryFocusFloatingPanel(
    {
      ...floated,
      panels: {
        ...floated.panels,
        [newPanelId]: {
          ...panel,
          floating: {
            ...panel.floating,
            popout,
          },
        },
      },
    },
    newPanelId,
  );
}

export function tileryDockPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  target: TileryDockPanelTarget | undefined,
  sizeContext?: TilerySizeResolutionContext,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  if (!panel.behavior.draggable) return state;

  const floatingPanelOrder = tileryFloatingPanelOrderFromState(state).filter(
    (id) => id !== panelId,
  );
  const behavior = targetHasLayoutBehavior(target)
    ? tileryNormalizeLayoutBehavior(target)
    : panel.behavior;
  const minSize = target?.minSize ?? panel.minSize;
  const maxSize = target?.maxSize ?? panel.maxSize;

  const dockedPanel: TileryPanelState = {
    id: panel.id,
    kind: 'tiled',
    inset: panel.inset,
    tabs: panel.tabs,
    activeTabId: panel.activeTabId,
    fullScreen: false,
    minSize,
    maxSize,
  };

  const tiledOrder = tileryPanelOrderFromState(state);
  if (tiledOrder.length === 0) {
    const layout: TileryLayoutTree = {
      kind: 'panel',
      panelId,
      ...behavior,
    };
    return tilerySyncLayoutPanels(
      {
        ...state,
        panels: { ...state.panels, [panelId]: dockedPanel },
        panelOrder: [panelId],
        floatingPanelOrder,
        layout,
      },
      layout,
    );
  }

  const splitPanelId = target?.splitPanel ?? tiledOrder[0]!;
  const targetSource = state.panels[splitPanelId];
  if (!targetSource || targetSource.kind !== 'tiled') return state;
  if (targetSource.fullScreen) return state;
  if (!tileryPanelBehaviorFromState(state, splitPanelId).droppable) {
    return state;
  }
  const direction = target?.direction ?? 'right';
  const sizePercent =
    target?.size ?? tileryDefaultDockSize(panel.floating.bounds);
  if (
    !tilerySplitFitsPanelConstraints(
      targetSource,
      direction,
      sizePercent,
      { minSize, maxSize },
      undefined,
      sizeContext,
    )
  ) {
    return state;
  }

  const { source: sourceInset, created: createdInset } = tilerySplitInset(
    targetSource.inset,
    direction,
    sizePercent,
  );
  const nextPanels: Record<TileryPanelId, TileryPanelState> = {
    ...state.panels,
    [targetSource.id]: {
      ...targetSource,
      inset: sourceInset,
      fullScreen: false,
    },
    [panelId]: {
      ...dockedPanel,
      inset: createdInset,
    },
  };
  const targetIdx = tiledOrder.indexOf(splitPanelId);
  const nextOrder = [
    ...tiledOrder.slice(0, targetIdx + 1),
    panelId,
    ...tiledOrder.slice(targetIdx + 1),
  ];
  const layout = state.layout
    ? tilerySplitPanelInLayout(
        state.layout,
        splitPanelId,
        panelId,
        direction,
        sizePercent,
        behavior,
      )
    : null;
  if (layout) {
    return tilerySyncLayoutPanels(
      {
        ...state,
        panels: nextPanels,
        panelOrder: nextOrder,
        floatingPanelOrder,
        layout,
      },
      layout,
    );
  }
  return {
    ...state,
    panels: nextPanels,
    panelOrder: nextOrder,
    floatingPanelOrder,
    layout: null,
  };
}

export function tileryFocusFloatingPanel(
  state: TileryLayoutState,
  panelId: TileryPanelId,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  const order = [
    ...tileryFloatingPanelOrderFromState(state).filter((id) => id !== panelId),
    panelId,
  ];
  return syncFloatingZIndexes(state, order);
}

export function tilerySetFloatingPanelBounds(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit: TileryFloatingPanelBounds,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating') return state;
  const bounds = tileryNormalizeFloatingBounds(
    boundsInit,
    panel.floating.bounds,
  );
  if (tileryFloatingBoundsEqual(panel.floating.bounds, bounds)) return state;
  return {
    ...state,
    panels: {
      ...state.panels,
      [panelId]: {
        ...panel,
        inset: tileryFloatingBoundsToInset(bounds),
        floating: { ...panel.floating, bounds },
      },
    },
  };
}

export function tilerySetPopoutWindowBounds(
  state: TileryLayoutState,
  panelId: TileryPanelId,
  boundsInit: TileryPopoutWindowBounds,
): TileryLayoutState {
  const panel = state.panels[panelId];
  if (!panel || panel.kind !== 'floating' || !panel.floating.popout) {
    return state;
  }
  const windowBounds = tileryNormalizePopoutWindowBounds(
    boundsInit,
    panel.floating.popout.windowBounds,
  );
  if (
    tileryPopoutWindowBoundsEqual(
      panel.floating.popout.windowBounds,
      windowBounds,
    )
  ) {
    return state;
  }
  return {
    ...state,
    panels: {
      ...state.panels,
      [panelId]: {
        ...panel,
        floating: {
          ...panel.floating,
          popout: { windowBounds },
        },
      },
    },
  };
}

export function tileryDefaultFloatingBounds(
  panel: TileryPanelState,
): TileryFloatingPanelBounds {
  const width = 100 - panel.inset.left - panel.inset.right;
  const height = 100 - panel.inset.top - panel.inset.bottom;
  const fallback =
    width > 85 && height > 85
      ? { x: 18, y: 12, width: 46, height: 48 }
      : {
          x: panel.inset.left,
          y: panel.inset.top,
          width,
          height,
        };
  return tileryNormalizeFloatingBounds(undefined, fallback);
}

export function tileryNormalizeFloatingBounds(
  value: TileryFloatingPanelBoundsInit | undefined,
  fallback: TileryFloatingPanelBounds,
): TileryFloatingPanelBounds {
  const width = clampFinite(value?.width ?? fallback.width, 12, 100);
  const height = clampFinite(value?.height ?? fallback.height, 12, 100);
  const x = clampFinite(value?.x ?? fallback.x, 0, 100 - width);
  const y = clampFinite(value?.y ?? fallback.y, 0, 100 - height);
  return {
    x: roundFloatingCoord(x),
    y: roundFloatingCoord(y),
    width: roundFloatingCoord(width),
    height: roundFloatingCoord(height),
  };
}

export const TILERY_DEFAULT_POPOUT_WINDOW_BOUNDS: TileryPopoutWindowBounds = {
  left: 80,
  top: 80,
  width: 720,
  height: 520,
};

export function tileryNormalizePopoutPanelPlacement(
  value: TileryPopoutPanelConfig | undefined,
): TileryPopoutPanelPlacement | undefined {
  if (!value) return undefined;
  const init = value === true ? undefined : value.windowBounds;
  return {
    windowBounds: tileryNormalizePopoutWindowBounds(
      init,
      TILERY_DEFAULT_POPOUT_WINDOW_BOUNDS,
    ),
  };
}

export function tileryNormalizePopoutWindowBounds(
  value: TileryPopoutWindowBoundsInit | undefined,
  fallback: TileryPopoutWindowBounds,
): TileryPopoutWindowBounds {
  const width = clampFinite(value?.width ?? fallback.width, 240, 10000);
  const height = clampFinite(value?.height ?? fallback.height, 160, 10000);
  return {
    left: Math.round(clampFinite(value?.left ?? fallback.left, -10000, 10000)),
    top: Math.round(clampFinite(value?.top ?? fallback.top, -10000, 10000)),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function tileryPopoutWindowFeatureString(
  bounds: TileryPopoutWindowBounds,
): string {
  return [
    'popup=yes',
    `left=${bounds.left}`,
    `top=${bounds.top}`,
    `width=${bounds.width}`,
    `height=${bounds.height}`,
  ].join(',');
}

export function tileryFloatingBoundsToInset(bounds: TileryFloatingPanelBounds) {
  return {
    top: bounds.y,
    right: 100 - bounds.x - bounds.width,
    bottom: 100 - bounds.y - bounds.height,
    left: bounds.x,
  };
}

export function tileryFloatingBoundsEqual(
  a: TileryFloatingPanelBounds,
  b: TileryFloatingPanelBounds,
): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

export function tileryPopoutWindowBoundsEqual(
  a: TileryPopoutWindowBounds,
  b: TileryPopoutWindowBounds,
): boolean {
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height
  );
}

export function tileryMergeFloatingBehavior(
  base: TileryLayoutBehavior,
  config: TileryLayoutBehaviorConfig | undefined,
): TileryLayoutBehavior {
  if (config?.locked === true) {
    return tileryLockedLayoutBehavior();
  }
  return {
    resizable: config?.resizable ?? base.resizable,
    draggable: config?.draggable ?? base.draggable,
    droppable: config?.droppable ?? base.droppable,
  };
}

export function tileryResizeFloatingBounds(
  bounds: TileryFloatingPanelBounds,
  edge: TileryFloatingResizeEdge,
  dx: number,
  dy: number,
): TileryFloatingPanelBounds {
  const next = { ...bounds };
  if (edge.includes('left')) {
    next.x = bounds.x + dx;
    next.width = bounds.width - dx;
  }
  if (edge.includes('right')) {
    next.width = bounds.width + dx;
  }
  if (edge.includes('top')) {
    next.y = bounds.y + dy;
    next.height = bounds.height - dy;
  }
  if (edge.includes('bottom')) {
    next.height = bounds.height + dy;
  }
  return next;
}

export function tileryLayoutBehaviorEqual(
  a: TileryLayoutBehavior,
  b: TileryLayoutBehavior,
): boolean {
  return (
    a.resizable === b.resizable &&
    a.draggable === b.draggable &&
    a.droppable === b.droppable
  );
}

export function tileryDefaultDockSize(
  bounds: TileryFloatingPanelBounds,
): number {
  return Math.max(20, Math.min(50, bounds.width));
}

export function tileryNextFloatingZIndex(state: TileryLayoutState): number {
  return tileryFloatingZIndex(tileryFloatingPanelOrderFromState(state).length);
}

export function tileryFloatingZIndex(index: number): number {
  return 20 + index;
}

function syncFloatingZIndexes(
  state: TileryLayoutState,
  order: TileryPanelId[],
): TileryLayoutState {
  let panels = state.panels;
  /* v8 ignore next -- normalized floating states carry an explicit order. */
  let changed = !arrayEqual(state.floatingPanelOrder ?? [], order);
  order.forEach((panelId, index) => {
    const panel = panels[panelId];
    /* v8 ignore next -- order is produced from existing floating panels. */
    if (!panel || panel.kind !== 'floating') return;
    const zIndex = tileryFloatingZIndex(index);
    if (panel.floating.zIndex === zIndex) return;
    if (panels === state.panels) panels = { ...state.panels };
    panels[panelId] = {
      ...panel,
      floating: { ...panel.floating, zIndex },
    };
    changed = true;
  });
  return changed ? { ...state, panels, floatingPanelOrder: order } : state;
}

function targetHasLayoutBehavior(
  target: TileryDockPanelTarget | undefined,
): boolean {
  return Boolean(
    target &&
    ('locked' in target ||
      'resizable' in target ||
      'draggable' in target ||
      'droppable' in target),
  );
}

function clampFinite(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, finite));
}

function roundFloatingCoord(value: number): number {
  return Number(value.toFixed(4));
}

function arrayEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
