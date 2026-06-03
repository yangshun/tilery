import type { TileryLayoutState } from '../types';
import type { TileryReducerAction } from './actions';
import { tileryWarnForConstraintDiagnostics } from './diagnostics';
import { tilerySetEdgePanelSize } from './edges';
import {
  tileryDockPanel,
  tileryFloatPanel,
  tileryFloatTab,
  tileryFocusFloatingPanel,
  tileryPopoutPanel,
  tileryPopoutTab,
  tileryReturnPanelToFloating,
  tilerySetFloatingPanelBounds,
  tilerySetPopoutWindowBounds,
} from './floating';
import {
  TILERY_DEFAULT_MIN_SIZE,
  tileryApplyDividerReset,
  tileryApplyDividerResize,
  tileryApplyJunctionResize,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
} from './layout-math';
import {
  tileryNormalizeLayoutForContainerResize,
  tileryNormalizeLayoutState,
  tilerySyncLayoutPanels,
} from './layout-tree';
import {
  tileryRemovePanel,
  tilerySetPanelFullScreen,
  tilerySplitPanel,
  tilerySwapPanels,
} from './panels';
import {
  tileryAppendTab,
  tileryChangeTabId,
  tileryInsertTab,
  tileryMoveTab,
  tileryRemoveTab,
  tilerySetActiveTab,
  tilerySetPanelData,
  tilerySetTabBehavior,
} from './tabs';

export type {
  TileryReducerAction,
  TileryReducerTabAction,
  TileryReducerTabInit,
} from './actions';
export {
  tileryCreateInitialState,
  tileryNextId,
  tileryPanelInitToReducerInit,
  tileryTabInitToReducerInit,
} from './initial-layout';

export function tileryReducer(
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLayoutState {
  const current = tileryNormalizeLayoutState(state);
  switch (action.type) {
    case 'PANEL_SPLIT': {
      return tilerySplitPanel(current, action);
    }
    case 'PANEL_REMOVE': {
      return tileryRemovePanel(current, action.panelId);
    }
    case 'PANEL_FULLSCREEN_SET': {
      return tilerySetPanelFullScreen(
        current,
        action.panelId,
        action.fullScreen,
      );
    }
    case 'PANEL_FLOAT': {
      return tileryFloatPanel(
        current,
        action.panelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'PANEL_POPOUT': {
      return tileryPopoutPanel(current, action.panelId, action.opts);
    }
    case 'PANEL_RETURN_TO_FLOATING': {
      return tileryReturnPanelToFloating(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'PANEL_DOCK': {
      return tileryDockPanel(
        current,
        action.panelId,
        action.target,
        action.sizeContext,
      );
    }
    case 'PANEL_FOCUS': {
      return tileryFocusFloatingPanel(current, action.panelId);
    }
    case 'PANEL_FLOATING_BOUNDS_SET': {
      return tilerySetFloatingPanelBounds(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'PANEL_POPOUT_WINDOW_BOUNDS_SET': {
      return tilerySetPopoutWindowBounds(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'PANEL_SWAP': {
      return tilerySwapPanels(current, action.panelA, action.panelB);
    }
    case 'EDGE_PANEL_SIZE_SET': {
      return tilerySetEdgePanelSize(
        current,
        action.panelId,
        action.size,
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
        action.sizeContext,
      );
    }
    case 'TAB_APPEND': {
      return tileryAppendTab(current, action);
    }
    case 'TAB_INSERT': {
      return tileryInsertTab(current, action);
    }
    case 'TAB_ID_CHANGE': {
      return tileryChangeTabId(current, action);
    }
    case 'TAB_REMOVE': {
      return tileryRemoveTab(current, action.tabId);
    }
    case 'TAB_MOVE': {
      return tileryMoveTab(current, action);
    }
    case 'TAB_ACTIVE_SET': {
      return tilerySetActiveTab(current, action.tabId);
    }
    case 'TAB_DATA_SET': {
      return tilerySetPanelData(current, action.tabId, action.data);
    }
    case 'TAB_BEHAVIOR_SET': {
      return tilerySetTabBehavior(current, action.tabId, action.behavior);
    }
    case 'TAB_FLOAT': {
      return tileryFloatTab(
        current,
        action.tabId,
        action.newPanelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'TAB_POPOUT': {
      return tileryPopoutTab(
        current,
        action.tabId,
        action.newPanelId,
        action.opts,
      );
    }
    case 'DIVIDER_RESIZE': {
      const dividers = tileryDeriveDividers(current);
      const target = dividers.find((d) => d.id === action.dividerId);
      if (!target) return current;
      const min = action.minSize ?? TILERY_DEFAULT_MIN_SIZE;
      const clamped = tileryClampDividerPosition(
        current,
        target,
        action.newPosition,
        min,
        action.sizeContext,
      );
      return tileryApplyDividerResize(current, target, clamped);
    }
    case 'DIVIDER_RESET': {
      const dividers = tileryDeriveDividers(current);
      const target = dividers.find((d) => d.id === action.dividerId);
      if (!target) return current;
      return tileryApplyDividerReset(
        current,
        target,
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
        action.sizeContext,
      );
    }
    case 'JUNCTION_RESIZE': {
      const junction = tileryDeriveJunctions(current).find(
        (j) => j.id === action.junctionId,
      );
      if (!junction) return current;
      return tileryApplyJunctionResize(
        current,
        junction,
        { x: action.x, y: action.y },
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
        action.sizeContext,
      );
    }
    case 'CONTAINER_SIZE_NORMALIZE': {
      if (!current.layout) return current;
      tileryWarnForConstraintDiagnostics(current, {
        minSize: action.minSize,
        sizeContext: action.sizeContext,
      });
      const layout = tileryNormalizeLayoutForContainerResize(
        current.layout,
        current.panels,
        action.minSize ?? TILERY_DEFAULT_MIN_SIZE,
        action.sizeContext,
      );
      if (layout === current.layout) return current;
      return tilerySyncLayoutPanels({ ...current, layout }, layout);
    }
    case 'STATE_REPLACE': {
      const next = tileryNormalizeLayoutState(action.state);
      tileryWarnForConstraintDiagnostics(next);
      return next;
    }
    default:
      return current;
  }
}
