import type { TileryLayoutState } from '../types';
import type { TileryReducerAction } from './actions';
import { tileryWarnForConstraintDiagnostics } from './diagnostics';
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
    case 'REPLACE_STATE': {
      const next = tileryNormalizeLayoutState(action.state);
      tileryWarnForConstraintDiagnostics(next);
      return next;
    }
    case 'SPLIT_PANEL': {
      return tilerySplitPanel(current, action);
    }
    case 'REMOVE_PANEL': {
      return tileryRemovePanel(current, action.panelId);
    }
    case 'SET_PANEL_FULLSCREEN': {
      return tilerySetPanelFullScreen(
        current,
        action.panelId,
        action.fullScreen,
      );
    }
    case 'FLOAT_PANEL': {
      return tileryFloatPanel(
        current,
        action.panelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'POPOUT_PANEL': {
      return tileryPopoutPanel(current, action.panelId, action.opts);
    }
    case 'RETURN_PANEL_TO_FLOATING': {
      return tileryReturnPanelToFloating(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'FLOAT_TAB': {
      return tileryFloatTab(
        current,
        action.tabId,
        action.newPanelId,
        action.bounds,
        action.behavior,
      );
    }
    case 'POPOUT_TAB': {
      return tileryPopoutTab(
        current,
        action.tabId,
        action.newPanelId,
        action.opts,
      );
    }
    case 'DOCK_PANEL': {
      return tileryDockPanel(
        current,
        action.panelId,
        action.target,
        action.sizeContext,
      );
    }
    case 'FOCUS_PANEL': {
      return tileryFocusFloatingPanel(current, action.panelId);
    }
    case 'SET_FLOATING_PANEL_BOUNDS': {
      return tilerySetFloatingPanelBounds(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'SET_POPOUT_WINDOW_BOUNDS': {
      return tilerySetPopoutWindowBounds(
        current,
        action.panelId,
        action.bounds,
      );
    }
    case 'APPEND_TAB': {
      return tileryAppendTab(current, action);
    }
    case 'INSERT_TAB': {
      return tileryInsertTab(current, action);
    }
    case 'CHANGE_TAB_ID': {
      return tileryChangeTabId(current, action);
    }
    case 'REMOVE_TAB': {
      return tileryRemoveTab(current, action.tabId);
    }
    case 'MOVE_TAB': {
      return tileryMoveTab(current, action);
    }
    case 'SET_ACTIVE_TAB': {
      return tilerySetActiveTab(current, action.tabId);
    }
    case 'SET_PANEL_DATA': {
      return tilerySetPanelData(current, action.tabId, action.data);
    }
    case 'SET_TAB_BEHAVIOR': {
      return tilerySetTabBehavior(current, action.tabId, action.behavior);
    }
    case 'RESIZE_DIVIDER': {
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
    case 'RESIZE_JUNCTION': {
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
    case 'NORMALIZE_CONTAINER_SIZE': {
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
    case 'SWAP_PANELS': {
      return tilerySwapPanels(current, action.panelA, action.panelB);
    }
    default:
      return current;
  }
}
