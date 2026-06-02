import type {
  TileryDockPanelTarget,
  TileryDirection,
  TileryFloatingPanelBounds,
  TileryFloatingPanelBoundsInit,
  TileryLayoutBehaviorConfig,
  TileryLayoutState,
  TileryPanelId,
  TileryPopoutPanelOptions,
  TileryPopoutWindowBounds,
  TilerySize,
  TilerySizeResolutionContext,
  TileryTabBehaviorUpdate,
  TileryTabId,
} from '../types';

export type TileryReducerTabInit = {
  id: TileryTabId;
  data: unknown;
  closeable: boolean;
  draggable: boolean;
};

export type TileryReducerTabAction = {
  id: TileryTabId;
  data: unknown;
  closeable?: boolean;
  draggable?: boolean;
};

export type TileryReducerAction =
  | {
      type: 'SPLIT_PANEL';
      panelId: TileryPanelId;
      direction: TileryDirection;
      sizePercent: number;
      newPanelId: TileryPanelId;
      minSize?: TilerySize;
      maxSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
      resizable?: boolean;
      draggable?: boolean;
      droppable?: boolean;
      tabs: TileryReducerTabAction[];
      activate: boolean;
    }
  | { type: 'REMOVE_PANEL'; panelId: TileryPanelId }
  | {
      type: 'SET_PANEL_FULLSCREEN';
      panelId: TileryPanelId;
      fullScreen: boolean;
    }
  | {
      type: 'FLOAT_PANEL';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'POPOUT_PANEL';
      panelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'RETURN_PANEL_TO_FLOATING';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
    }
  | {
      type: 'FLOAT_TAB';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'POPOUT_TAB';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'DOCK_PANEL';
      panelId: TileryPanelId;
      target?: TileryDockPanelTarget;
      sizeContext?: TilerySizeResolutionContext;
    }
  | { type: 'FOCUS_PANEL'; panelId: TileryPanelId }
  | {
      type: 'SET_FLOATING_PANEL_BOUNDS';
      panelId: TileryPanelId;
      bounds: TileryFloatingPanelBounds;
    }
  | {
      type: 'SET_POPOUT_WINDOW_BOUNDS';
      panelId: TileryPanelId;
      bounds: TileryPopoutWindowBounds;
    }
  | {
      type: 'APPEND_TAB';
      panelId: TileryPanelId;
      tab: TileryReducerTabAction;
      activate: boolean;
    }
  | {
      type: 'INSERT_TAB';
      panelId: TileryPanelId;
      tab: TileryReducerTabAction;
      index: number;
      activate: boolean;
    }
  | { type: 'REMOVE_TAB'; tabId: TileryTabId }
  | {
      type: 'MOVE_TAB';
      tabId: TileryTabId;
      to:
        | { panelId: TileryPanelId; index: number }
        | { beforeTabId: TileryTabId }
        | { afterTabId: TileryTabId }
        | {
            splitPanelId: TileryPanelId;
            direction: TileryDirection;
            sizePercent: number;
            newPanelId: TileryPanelId;
            minSize?: TilerySize;
            maxSize?: TilerySize;
            sizeContext?: TilerySizeResolutionContext;
            resizable?: boolean;
            draggable?: boolean;
            droppable?: boolean;
          };
    }
  | { type: 'SET_ACTIVE_TAB'; tabId: TileryTabId }
  | { type: 'SET_PANEL_DATA'; tabId: TileryTabId; data: unknown }
  | {
      type: 'SET_TAB_BEHAVIOR';
      tabId: TileryTabId;
      behavior: TileryTabBehaviorUpdate;
    }
  | {
      type: 'RESIZE_DIVIDER';
      dividerId: string;
      newPosition: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'RESIZE_JUNCTION';
      junctionId: string;
      x: number;
      y: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'NORMALIZE_CONTAINER_SIZE';
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | { type: 'SWAP_PANELS'; panelA: TileryPanelId; panelB: TileryPanelId }
  | { type: 'REPLACE_STATE'; state: TileryLayoutState };
