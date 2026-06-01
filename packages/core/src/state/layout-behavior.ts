import type {
  TileryLayoutBehavior,
  TileryLayoutBehaviorConfig,
  TileryLayoutState,
  TileryLayoutTree,
  TileryPanelId,
} from '../types';

export const TILERY_DEFAULT_LAYOUT_BEHAVIOR: TileryLayoutBehavior = {
  resizable: true,
  draggable: true,
  droppable: true,
};

export function tileryNormalizeLayoutBehavior(
  config: TileryLayoutBehaviorConfig | undefined,
): TileryLayoutBehavior {
  if (config?.locked === true) {
    return { resizable: false, draggable: false, droppable: false };
  }
  return {
    resizable: config?.resizable ?? true,
    draggable: config?.draggable ?? true,
    droppable: config?.droppable ?? true,
  };
}

export function tileryBehaviorFromNode(
  node: Pick<TileryLayoutTree, 'resizable' | 'draggable' | 'droppable'>,
): TileryLayoutBehavior {
  return {
    resizable: node.resizable ?? true,
    draggable: node.draggable ?? true,
    droppable: node.droppable ?? true,
  };
}

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

export function tileryPanelBehaviorFromState(
  state: TileryLayoutState,
  panelId: TileryPanelId,
): TileryLayoutBehavior {
  if (!state.layout) return TILERY_DEFAULT_LAYOUT_BEHAVIOR;
  return (
    findPanelBehavior(state.layout, panelId, TILERY_DEFAULT_LAYOUT_BEHAVIOR) ??
    TILERY_DEFAULT_LAYOUT_BEHAVIOR
  );
}

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
