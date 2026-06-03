/**
 * Normalize and cascade resize/drag/drop behavior.
 * Converts user-facing config (including the `locked` shorthand) to resolved
 * booleans and propagates inherited behavior down the layout tree.
 */
import type {
  TileryLayoutBehavior,
  TileryLayoutBehaviorConfig,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelId,
} from '../types';

/** The default behavior applied to every panel when no overrides are provided. */
export const TILERY_DEFAULT_LAYOUT_BEHAVIOR: TileryLayoutBehavior = {
  resizable: true,
  draggable: true,
  droppable: true,
};

/**
 * Canonical expansion of `locked: true` — all three interaction flags are
 * disabled. Returns a fresh object each time so callers may mutate it freely.
 */
export function tileryLockedLayoutBehavior(): TileryLayoutBehavior {
  return { resizable: false, draggable: false, droppable: false };
}

/**
 * Resolve a behavior config object to explicit booleans, expanding the
 * `locked` shorthand and filling any missing flags with `true` (enabled).
 */
export function tileryNormalizeLayoutBehavior(
  config: TileryLayoutBehaviorConfig | undefined,
): TileryLayoutBehavior {
  if (config?.locked === true) {
    return tileryLockedLayoutBehavior();
  }
  return {
    resizable: config?.resizable ?? true,
    draggable: config?.draggable ?? true,
    droppable: config?.droppable ?? true,
  };
}

/**
 * Extract the behavior flags stored on a layout tree node, defaulting any
 * undefined flag to `true`.
 */
export function tileryBehaviorFromNode(
  node: Pick<TileryLayoutTree, 'resizable' | 'draggable' | 'droppable'>,
): TileryLayoutBehavior {
  return {
    resizable: node.resizable ?? true,
    draggable: node.draggable ?? true,
    droppable: node.droppable ?? true,
  };
}

/**
 * Combine parent and child behavior by ANDing each flag, so a disabled flag
 * anywhere in the ancestor chain disables the behavior for all descendants.
 */
export function tileryMergeLayoutBehavior(
  parent: TileryLayoutBehavior,
  child: TileryLayoutBehavior,
): TileryLayoutBehavior {
  return {
    resizable: parent.resizable && child.resizable,
    draggable: parent.draggable && child.draggable,
    droppable: parent.droppable && child.droppable,
  };
}

/**
 * Resolve the effective behavior for a panel by walking the layout tree and
 * merging inherited flags. Returns the default (all enabled) when the panel
 * is not found or the state has no layout tree.
 */
export function tileryPanelBehaviorFromState(
  state: TileryLayoutState,
  panelId: TileryPanelId,
): TileryLayoutBehavior {
  const panel = state.panels[panelId];
  if (panel?.kind === 'floating' || panel?.kind === 'edge') {
    return panel.behavior;
  }
  if (!state.layout) return TILERY_DEFAULT_LAYOUT_BEHAVIOR;
  return (
    findPanelBehavior(state.layout, panelId, TILERY_DEFAULT_LAYOUT_BEHAVIOR) ??
    TILERY_DEFAULT_LAYOUT_BEHAVIOR
  );
}

/**
 * Return `true` when a tab is allowed to move from `sourcePanelId` to
 * `targetPanelId` — the source must be draggable and the target droppable.
 * Intra-panel reordering also requires both flags on the same panel.
 */
export function tileryCanMoveTabBetweenPanels(
  state: TileryLayoutState,
  sourcePanelId: TileryPanelId,
  targetPanelId: TileryPanelId,
): boolean {
  const source = tileryPanelBehaviorFromState(state, sourcePanelId);
  const target = tileryPanelBehaviorFromState(state, targetPanelId);
  if (sourcePanelId === targetPanelId) {
    return source.draggable && source.droppable;
  }
  return source.draggable && target.droppable;
}

/**
 * Return `true` when both panels have draggable and droppable enabled, which
 * is required before a panel swap can be committed.
 */
export function tileryCanSwapPanels(
  state: TileryLayoutState,
  panelA: TileryPanelId,
  panelB: TileryPanelId,
): boolean {
  const a = tileryPanelBehaviorFromState(state, panelA);
  const b = tileryPanelBehaviorFromState(state, panelB);
  return a.draggable && a.droppable && b.draggable && b.droppable;
}

function findPanelBehavior(
  node: TileryLayoutTree,
  panelId: TileryPanelId,
  inherited: TileryLayoutBehavior,
): TileryLayoutBehavior | null {
  const behavior = tileryMergeLayoutBehavior(
    inherited,
    tileryBehaviorFromNode(node),
  );
  if (node.kind === 'panel') {
    return node.panelId === panelId ? behavior : null;
  }
  for (const child of node.children) {
    const found = findPanelBehavior(child, panelId, behavior);
    if (found) return found;
  }
  return null;
}
