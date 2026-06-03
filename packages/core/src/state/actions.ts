/**
 * The internal reducer action union. Every dispatchable mutation the
 * reducer handles is represented as a discriminated-union member here.
 */
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

/**
 * Normalized tab descriptor used when a tab is being created by the
 * reducer (e.g. during append, insert, or split). All behavior flags are
 * fully resolved — no optional omissions.
 */
export type TileryReducerTabInit = {
  id: TileryTabId;
  data: unknown;
  closable: boolean;
  draggable: boolean;
};

/**
 * Tab descriptor carried inside actions that create or reference a tab.
 * Behavior flags are optional and fall back to the panel/global defaults
 * when omitted.
 */
export type TileryReducerTabAction = {
  id: TileryTabId;
  data: unknown;
  closable?: boolean;
  draggable?: boolean;
};

/**
 * The complete set of actions the Tilery reducer handles. Each member
 * encodes one discrete layout mutation — panel lifecycle (split, remove,
 * float, dock, …), tab lifecycle (append, insert, move, remove, …), resize
 * operations (dividers, junctions, edge panels), and full-state replacement.
 */
export type TileryReducerAction =
  | {
      type: 'PANEL_SPLIT';
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
  | { type: 'PANEL_REMOVE'; panelId: TileryPanelId }
  | {
      type: 'PANEL_FULLSCREEN_SET';
      panelId: TileryPanelId;
      fullScreen: boolean;
    }
  | {
      type: 'PANEL_FLOAT';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'PANEL_POPOUT';
      panelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'PANEL_RETURN_TO_FLOATING';
      panelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
    }
  | {
      type: 'PANEL_DOCK';
      panelId: TileryPanelId;
      target?: TileryDockPanelTarget;
      sizeContext?: TilerySizeResolutionContext;
    }
  | { type: 'PANEL_FOCUS'; panelId: TileryPanelId }
  | {
      type: 'PANEL_FLOATING_BOUNDS_SET';
      panelId: TileryPanelId;
      bounds: TileryFloatingPanelBounds;
    }
  | {
      type: 'PANEL_POPOUT_WINDOW_BOUNDS_SET';
      panelId: TileryPanelId;
      bounds: TileryPopoutWindowBounds;
    }
  | { type: 'PANEL_SWAP'; panelA: TileryPanelId; panelB: TileryPanelId }
  | {
      type: 'EDGE_PANEL_SIZE_SET';
      panelId: TileryPanelId;
      size: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'TAB_APPEND';
      panelId: TileryPanelId;
      tab: TileryReducerTabAction;
      activate: boolean;
    }
  | {
      type: 'TAB_INSERT';
      panelId: TileryPanelId;
      tab: TileryReducerTabAction;
      index: number;
      activate: boolean;
    }
  | {
      type: 'TAB_ID_CHANGE';
      oldTabId: TileryTabId;
      newTabId: TileryTabId;
    }
  | { type: 'TAB_REMOVE'; tabId: TileryTabId }
  | {
      type: 'TAB_MOVE';
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
          }
        | {
            splitRoot: true;
            direction: TileryDirection;
            sizePercent?: number;
            newPanelId: TileryPanelId;
            minSize?: TilerySize;
            maxSize?: TilerySize;
            sizeContext?: TilerySizeResolutionContext;
            resizable?: boolean;
            draggable?: boolean;
            droppable?: boolean;
          };
    }
  | { type: 'TAB_ACTIVE_SET'; tabId: TileryTabId }
  | { type: 'TAB_DATA_SET'; tabId: TileryTabId; data: unknown }
  | {
      type: 'TAB_BEHAVIOR_SET';
      tabId: TileryTabId;
      behavior: TileryTabBehaviorUpdate;
    }
  | {
      type: 'TAB_FLOAT';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      bounds?: TileryFloatingPanelBoundsInit;
      behavior?: TileryLayoutBehaviorConfig;
    }
  | {
      type: 'TAB_POPOUT';
      tabId: TileryTabId;
      newPanelId: TileryPanelId;
      opts?: TileryPopoutPanelOptions;
    }
  | {
      type: 'DIVIDER_RESIZE';
      dividerId: string;
      newPosition: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'DIVIDER_RESET';
      dividerId: string;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'JUNCTION_RESIZE';
      junctionId: string;
      x: number;
      y: number;
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | {
      type: 'CONTAINER_SIZE_NORMALIZE';
      minSize?: TilerySize;
      sizeContext?: TilerySizeResolutionContext;
    }
  | { type: 'STATE_REPLACE'; state: TileryLayoutState };
