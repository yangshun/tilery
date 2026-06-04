'use client';

/**
 * The `Tilery` React component: its public props, resize event types, and the
 * rendering glue that drives panels, tabs, dividers, and resize handles.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { PanelChrome } from './components/panel-chrome';
import { TileryDivider, type DividerAccessibility } from './components/divider';
import { EdgeResizeHandle } from './components/edge-resize-handle';
import { TileryJunction } from './components/junction';
import { DropOverlay } from './components/drop-overlay';
import { tileryPanelDomId } from './dom-ids';
import {
  makeLifecycleEvents,
  type TileryActiveTabChangeEvent,
  type TileryPanelsCloseEvent,
  type TileryPanelsOpenEvent,
  type TileryPanelSplitEvent,
  type TileryTabsCloseEvent,
  type TileryTabsMoveEvent,
  type TileryTabsOpenEvent,
} from './lifecycle';
import { useTileryDragController } from './use-drag-controller';
import { useTileryFloatingPanelDrag } from './use-floating-panel-drag';
import { useTileryPopoutWindows } from './use-popout-windows';
import {
  tileryCreateInitialState,
  tileryReducer,
  makeTileryController,
  tileryAllPanelOrderFromState,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryEdgePanelOrderFromState,
  tileryEdgePanelSizes,
  tileryFloatingPanelOrderFromState,
  tileryGetFullScreenPanelId,
  tileryPanelBehaviorFromState,
  tileryPanelOrderFromState,
  tileryWarnForConstraintDiagnostics,
  type TileryReducerAction,
  type TileryEdge,
  type TileryInitialLayout,
  type TileryDivider as TileryDividerState,
  type TileryDividerOrientation,
  type TileryLayoutState,
  type TileryController,
  type TileryPanel,
  type TileryPanelId,
  type TilerySize,
  type TilerySizeResolutionContext,
  type TileryTab,
  type TileryTabId,
  type TileryTabInit,
} from 'tilery/internal';

import 'tilery/style.css';

/**
 * Controls whether a per-panel control is shown: a constant for all panels, or
 * a predicate evaluated against each panel.
 */
export type TileryPanelVisibility = boolean | ((panel: TileryPanel) => boolean);

/**
 * Produces the tab to open when the new-tab button is pressed; returning
 * nothing skips opening a tab.
 */
export type TileryNewTabHandler<TData = unknown> = (
  panel: TileryPanel,
  ctx: { tilery: TileryController },
) => TileryTabInit<TData> | void;

/** Context for `renderPanelActions`, including a way to close the menu. */
export type TileryPanelActionsRenderContext = {
  /** Controller for the current Tilery instance. */
  tilery: TileryController;
  /** Closes the open panel action menu. */
  closeMenu: () => void;
};

/**
 * Props Tilery hands to a custom tab trigger; spread them onto your element to
 * preserve selection, drag, and accessibility behavior.
 */
export type TileryTabTriggerProps = React.HTMLAttributes<HTMLElement> & {
  /** Ref callback Tilery uses to track the trigger element. */
  ref: React.RefCallback<HTMLElement>;
  /** Class name carrying Tilery's tab styling. */
  className: string;
  /** ARIA role identifying the element as a tab. */
  role: 'tab';
  /** Whether this tab is the panel's active tab. */
  'aria-selected': boolean;
  /** Active-state hook for styling. */
  'data-active': boolean;
  /** Whether the tab can be closed. */
  'data-closable': boolean;
  /** Whether the tab can be dragged. */
  'data-draggable': boolean;
  /** Identifier of the tab this trigger represents. */
  'data-tab-id': TileryTabId;
};

/** Context passed to a `renderTabTrigger` renderer for a single tab. */
export type TileryTabTriggerRenderContext<TData = unknown> = {
  /** The tab being rendered. */
  tab: TileryTab<TData>;
  /** Whether the tab is currently active. */
  isActive: boolean;
  /** Props that must be spread onto the rendered trigger element. */
  props: TileryTabTriggerProps;
  /** The tab header content to render inside the trigger. */
  children: React.ReactNode;
};

/**
 * Renders the clickable element for a tab (e.g. an anchor or router link)
 * instead of the default trigger.
 */
export type TileryTabTriggerRenderer<TData = unknown> = (
  ctx: TileryTabTriggerRenderContext<TData>,
) => React.ReactElement;

/** Whether a resize was driven by the keyboard or by pointer dragging. */
export type TileryResizeInput = 'keyboard' | 'pointer';
/** Whether a resize event is a live update or the final committed value. */
export type TileryResizePhase = 'resize' | 'end';
/** The axis a panel was resized along. */
export type TileryResizeDimension = 'width' | 'height';

/** A single panel's size change reported within a resize event. */
export type TileryResizePanelChange = {
  /** Panel whose size changed. */
  panelId: TileryPanelId;
  /** Axis that changed. */
  dimension: TileryResizeDimension;
  /** Size before the change, as a percentage of the container. */
  previousSize: number;
  /** Size after the change, as a percentage of the container. */
  size: number;
  /** Previous size in pixels, when the container could be measured. */
  previousPixelSize?: number;
  /** New size in pixels, when the container could be measured. */
  pixelSize?: number;
};

/** Identifies the handle that drove a resize and its before/after geometry. */
export type TileryResizeSource =
  | {
      type: 'divider';
      dividerId: string;
      orientation: TileryDividerOrientation;
      previousPosition: number;
      position: number;
    }
  | {
      type: 'junction';
      junctionId: string;
      previousX: number;
      previousY: number;
      x: number;
      y: number;
      verticalDividerId: string;
      horizontalDividerId: string;
    }
  | {
      type: 'edge';
      panelId: TileryPanelId;
      side: TileryEdge;
      previousSize: number;
      size: number;
    };

/** Payload for `onResize` and `onResizeEnd` describing a resize interaction. */
export type TileryResizeEvent = {
  /** Whether this is a live resize update or the committed end value. */
  phase: TileryResizePhase;
  /** Whether the keyboard or pointer drove the resize. */
  input: TileryResizeInput;
  /** The handle that drove the resize and its geometry. */
  source: TileryResizeSource;
  /** Every panel whose size changed in this step. */
  changes: TileryResizePanelChange[];
  /** Layout state before the resize. */
  previousState: TileryLayoutState;
  /** Layout state after the resize. */
  state: TileryLayoutState;
};

type TileryResizeAction = Extract<
  TileryReducerAction,
  {
    type:
      | 'DIVIDER_RESIZE'
      | 'DIVIDER_RESET'
      | 'JUNCTION_RESIZE'
      | 'EDGE_PANEL_SIZE_SET';
  }
>;

/** Props for the {@link Tilery} component. */
export type TileryProps<TData = unknown> = {
  /** Initial panel and tab configuration that seeds the workspace. */
  initialLayout: TileryInitialLayout<TData>;
  /** Renders the content shown inside a tab's button in the tab bar. */
  renderTabHeader: (
    tab: TileryTab<TData>,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  /**
   * Renders the tab's clickable element when it needs to be a link or router
   * component. Spread the provided props onto your element to keep selection,
   * drag, and accessibility behavior intact.
   */
  renderTabTrigger?: TileryTabTriggerRenderer<TData>;
  /** Renders the panel content displayed for a tab. */
  renderTabContent: (tab: TileryTab<TData>) => React.ReactNode;
  /** Called after every state change; use it to persist or inspect layout. */
  onChange?: (state: TileryLayoutState) => void;
  /**
   * Fires continuously while a divider, junction, or edge is being resized by
   * pointer or keyboard.
   */
  onResize?: (event: TileryResizeEvent) => void;
  /**
   * Fires once a resize commits: on pointer release, after each keyboard step,
   * and after a double-click divider reset (reported as `input: 'pointer'`).
   */
  onResizeEnd?: (event: TileryResizeEvent) => void;
  /** Fires when one or more panels switch from one active tab to another. */
  onActiveTabChange?: (event: TileryActiveTabChangeEvent) => void;
  /** Fires when tabs move between panels, indexes, floating, or splits. */
  onTabsMove?: (event: TileryTabsMoveEvent<TData>) => void;
  /**
   * Fires when panels are created through floating extraction, popout, or
   * layout replacement.
   */
  onPanelsOpen?: (event: TileryPanelsOpenEvent<TData>) => void;
  /** Fires when a panel is split into two, explicitly or by a tab move. */
  onPanelSplit?: (event: TileryPanelSplitEvent<TData>) => void;
  /** Fires when tabs are added to a panel. */
  onTabsOpen?: (event: TileryTabsOpenEvent<TData>) => void;
  /**
   * Fires when tabs are removed. Does not fire when a tab merely moves out of a
   * panel; that case surfaces through `onPanelsClose` instead.
   */
  onTabsClose?: (event: TileryTabsCloseEvent<TData>) => void;
  /**
   * Fires when panels are removed. When a panel closes because its last tab
   * moved out, the moved tab is reported here even though `onTabsClose` did not
   * fire.
   */
  onPanelsClose?: (event: TileryPanelsCloseEvent<TData>) => void;
  /**
   * Default minimum panel size applied where the layout tree does not specify a
   * per-panel constraint.
   * @defaultValue 10
   */
  minSize?: TilerySize;
  /**
   * Enables or disables every resize handle in the instance.
   * @defaultValue true
   */
  resizable?: boolean;
  /**
   * Pointer hit-target size, in pixels, for dividers and junction resize
   * controls.
   * @defaultValue 24
   */
  resizeHandleHitSize?: number;
  /**
   * Shows the built-in panel action menu button, for all panels or per panel.
   * @defaultValue false
   */
  showActionsButton?: TileryPanelVisibility;
  /**
   * Shows the optional new-tab button, for all panels or per panel.
   * @defaultValue false
   */
  showNewTabButton?: TileryPanelVisibility;
  /** Responds to the new-tab button, returning the tab to open (if any). */
  onNewTab?: TileryNewTabHandler<TData>;
  /** Appends custom content to a panel's built-in action menu. */
  renderPanelActions?: (
    panel: TileryPanel,
    ctx: TileryPanelActionsRenderContext,
  ) => React.ReactNode;
  /** Customizes the icon shown on a panel's action menu button. */
  renderActionsButtonIcon?: (panel: TileryPanel) => React.ReactNode;
};

/**
 * Renders a resizable, tabbed panel workspace from an initial layout. Accepts a
 * `TileryController` ref for imperative control and emits resize and lifecycle
 * events as panels and tabs change.
 */
export const Tilery = forwardRef(function Tilery<TData = unknown>(
  props: TileryProps<TData>,
  ref: React.Ref<TileryController>,
) {
  const {
    initialLayout,
    renderTabHeader,
    renderTabTrigger,
    renderTabContent,
    onChange,
    onResize,
    onResizeEnd,
    onActiveTabChange,
    onTabsMove,
    onPanelsOpen,
    onPanelSplit,
    onTabsOpen,
    onTabsClose,
    onPanelsClose,
    minSize = 10,
    resizable = true,
    resizeHandleHitSize,
    showActionsButton = false,
    showNewTabButton = false,
    onNewTab,
    renderPanelActions,
    renderActionsButtonIcon,
  } = props;

  const [state, dispatch] = useReducer(
    tileryReducer,
    initialLayout,
    tileryCreateInitialState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const resizeStateRef = useRef(state);
  resizeStateRef.current = state;
  const lifecycleStateRef = useRef(state);
  lifecycleStateRef.current = state;
  const lastResizeEventRef = useRef<TileryResizeEvent | null>(null);
  const lifecycleCallbacksRef = useRef<
    Pick<
      TileryProps<TData>,
      | 'onActiveTabChange'
      | 'onTabsMove'
      | 'onPanelsOpen'
      | 'onPanelSplit'
      | 'onTabsOpen'
      | 'onTabsClose'
      | 'onPanelsClose'
    >
  >({
    onActiveTabChange,
    onTabsMove,
    onPanelsOpen,
    onPanelSplit,
    onTabsOpen,
    onTabsClose,
    onPanelsClose,
  });
  lifecycleCallbacksRef.current = {
    onActiveTabChange,
    onTabsMove,
    onPanelsOpen,
    onPanelSplit,
    onTabsOpen,
    onTabsClose,
    onPanelsClose,
  };

  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const [sizeContext, setSizeContext] = useState<TilerySizeResolutionContext>(
    {},
  );
  const getSizeContext = useCallback(
    () => measureContainer(mainContainerRef.current),
    [],
  );
  const normalizeContainerSize = useCallback(
    (nextSizeContext: TilerySizeResolutionContext) => {
      const action: TileryReducerAction = {
        type: 'CONTAINER_SIZE_NORMALIZE',
        minSize,
        sizeContext: nextSizeContext,
      };
      const previousState = stateRef.current;
      const nextState = tileryReducer(previousState, action);
      if (nextState === previousState) return;
      stateRef.current = nextState;
      resizeStateRef.current = nextState;
      lifecycleStateRef.current = nextState;
      dispatch(action);
    },
    [minSize],
  );

  useLayoutEffect(() => {
    const container = mainContainerRef.current;
    /* v8 ignore next */
    if (!container) return;
    const updateSizeContext = () => {
      const next = measureContainer(container);
      /* v8 ignore next -- duplicate size reports are only a render optimization. */
      setSizeContext((prev) => (sizeContextEqual(prev, next) ? prev : next));
      normalizeContainerSize(next);
    };
    updateSizeContext();
    /* v8 ignore start -- ResizeObserver delivery is browser-provided. */
    const ResizeObserverCtor =
      container.ownerDocument.defaultView?.ResizeObserver;
    if (!ResizeObserverCtor) return;
    const observer = new ResizeObserverCtor(updateSizeContext);
    observer.observe(container);
    return () => observer.disconnect();
    /* v8 ignore stop */
  }, [normalizeContainerSize]);

  const dispatchResize = useCallback(
    (action: TileryResizeAction, input: TileryResizeInput): boolean => {
      const nextSizeContext = action.sizeContext ?? getSizeContext();
      setSizeContext((prev) =>
        sizeContextEqual(prev, nextSizeContext) ? prev : nextSizeContext,
      );
      const resizeAction = {
        ...action,
        /* v8 ignore next */
        minSize: action.minSize ?? minSize,
        sizeContext: nextSizeContext,
      } as TileryResizeAction;
      const previousState = resizeStateRef.current;
      tileryWarnForConstraintDiagnostics(previousState, {
        minSize: resizeAction.minSize,
        sizeContext: nextSizeContext,
        warnUnresolvedPixels: true,
      });
      const nextState = tileryReducer(previousState, resizeAction);
      const eventContainer =
        resizeAction.type === 'EDGE_PANEL_SIZE_SET'
          ? rootContainerRef.current
          : mainContainerRef.current;
      const event = makeResizeEvent(
        previousState,
        nextState,
        resizeAction,
        input,
        eventContainer,
      );
      if (!event) return false;
      resizeStateRef.current = nextState;
      lifecycleStateRef.current = nextState;
      lastResizeEventRef.current = event;
      dispatch(resizeAction);
      onResize?.(event);
      return true;
    },
    [getSizeContext, minSize, onResize],
  );

  const commitResize = useCallback(() => {
    const event = lastResizeEventRef.current;
    if (!event) return;
    lastResizeEventRef.current = null;
    onResizeEnd?.({ ...event, phase: 'end' });
  }, [onResizeEnd]);

  const dispatchWithLifecycle = useCallback((action: TileryReducerAction) => {
    const previousState = lifecycleStateRef.current;
    const nextState = tileryReducer(previousState, action);
    const events = makeLifecycleEvents<TData>(previousState, nextState, action);
    lifecycleStateRef.current = nextState;
    resizeStateRef.current = nextState;
    dispatch(action);
    const {
      onActiveTabChange,
      onTabsMove,
      onPanelsOpen,
      onPanelSplit,
      onTabsOpen,
      onTabsClose,
      onPanelsClose,
    } = lifecycleCallbacksRef.current;
    if (events.panelsOpen) onPanelsOpen?.(events.panelsOpen);
    if (events.panelSplit) onPanelSplit?.(events.panelSplit);
    if (events.tabsOpen) onTabsOpen?.(events.tabsOpen);
    if (events.tabsMove) onTabsMove?.(events.tabsMove);
    if (events.tabsClose) onTabsClose?.(events.tabsClose);
    if (events.panelsClose) onPanelsClose?.(events.panelsClose);
    if (events.activeTabChange) onActiveTabChange?.(events.activeTabChange);
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const { popoutRoots, requestPopoutPanel, returnPopoutPanelToFloating } =
    useTileryPopoutWindows({
      containerRef: rootContainerRef,
      state,
      dispatchWithLifecycle,
    });

  const tileryRef = useRef<TileryController | null>(null);
  if (!tileryRef.current) {
    tileryRef.current = makeTileryController(
      getState,
      dispatchWithLifecycle,
      getSizeContext,
      {
        requestPopoutPanel,
        onReturnPanelToFloating: returnPopoutPanelToFloating,
      },
    );
  }
  useImperativeHandle(ref, () => tileryRef.current!, []);

  const panelCache = useRef<Map<TileryPanelId, TileryPanel>>(new Map());
  const getCachedPanel = useCallback(
    (id: TileryPanelId): TileryPanel | null => {
      /* v8 ignore next 4 */
      if (!stateRef.current.panels[id]) {
        panelCache.current.delete(id);
        return null;
      }
      const cached = panelCache.current.get(id);
      if (cached) return cached;
      const fresh = tileryRef.current!.getPanel(id);
      /* v8 ignore next */
      if (!fresh) return null;
      panelCache.current.set(id, fresh);
      return fresh;
    },
    [],
  );
  const tabCache = useRef<Map<TileryTabId, TileryTab>>(new Map());
  const getCachedTab = useCallback((id: TileryTabId): TileryTab | null => {
    if (!stateRef.current.tabs[id]) {
      tabCache.current.delete(id);
      return null;
    }
    const cached = tabCache.current.get(id);
    if (cached) return cached;
    const fresh = tileryRef.current!.getTab(id);
    /* v8 ignore next */
    if (!fresh) return null;
    tabCache.current.set(id, fresh);
    return fresh;
  }, []);

  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  const drag = useTileryDragController(
    () => tileryRef.current,
    mainContainerRef,
  );
  const floatingDrag = useTileryFloatingPanelDrag({
    tilery: () => tileryRef.current,
    containerRef: rootContainerRef,
    onTabPointerMove: drag.onTabPointerMove,
    onTabBarPointerUp: drag.onTabBarPointerUp,
    onTabPointerCancel: drag.onTabPointerCancel,
  });

  // Escape aborts any in-progress drag: a floating panel move/resize reverts to
  // its starting bounds, while a tab/panel drag discards its uncommitted drop
  // preview. The cancel callbacks are held in refs so a single keydown listener
  // stays attached across the frequent re-renders a live drag triggers. Only
  // consume the key when a drag was actually cancelled, leaving Escape free for
  // menus, dialogs, and anything wrapping the layout.
  const cancelFloatingDragRef = useRef(floatingDrag.cancelDrag);
  cancelFloatingDragRef.current = floatingDrag.cancelDrag;
  const cancelTabDragRef = useRef(drag.cancelDrag);
  cancelTabDragRef.current = drag.cancelDrag;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (cancelFloatingDragRef.current() || cancelTabDragRef.current()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  const [limboEl] = useState(() => {
    /* v8 ignore next */
    if (typeof document === 'undefined') return null;
    const div = document.createElement('div');
    div.className = 'tilery__limbo';
    div.setAttribute('aria-hidden', 'true');
    return div;
  });
  useEffect(() => {
    const container = rootContainerRef.current;
    /* v8 ignore next */
    if (!limboEl || !container) return;
    container.appendChild(limboEl);
    /* v8 ignore next 3 */
    return () => {
      if (limboEl.parentNode === container) container.removeChild(limboEl);
    };
  }, [limboEl]);

  const [contentSlots, setContentSlots] = useState<
    Record<TileryPanelId, HTMLElement | null>
  >({});
  const slotCbCache = useRef<
    Map<TileryPanelId, (el: HTMLElement | null) => void>
  >(new Map());
  const getRegisterContentSlot = useCallback((panelId: TileryPanelId) => {
    const cached = slotCbCache.current.get(panelId);
    if (cached) return cached;
    const cb = (el: HTMLElement | null) => {
      setContentSlots((prev) => {
        /* v8 ignore next */
        if (prev[panelId] === el) return prev;
        return { ...prev, [panelId]: el };
      });
    };
    slotCbCache.current.set(panelId, cb);
    return cb;
  }, []);

  const tabHosts = useRef<Map<TileryTabId, HTMLDivElement>>(new Map());
  const ensureTabHost = (tabId: TileryTabId): HTMLDivElement | null => {
    /* v8 ignore next */
    if (typeof document === 'undefined') return null;
    let host = tabHosts.current.get(tabId);
    if (!host) {
      host = document.createElement('div');
      host.className = 'tilery__tab-host';
      host.setAttribute('data-tab-host', tabId);
      tabHosts.current.set(tabId, host);
    }
    return host;
  };

  useEffect(() => {
    for (const [tabId, host] of tabHosts.current.entries()) {
      const tabState = state.tabs[tabId];
      if (!tabState) {
        host.remove();
        tabHosts.current.delete(tabId);
        continue;
      }
      const slot = contentSlots[tabState.panelId] ?? limboEl;
      if (slot && host.parentNode !== slot) {
        slot.appendChild(host);
      }
    }
  }, [state.tabs, contentSlots, limboEl]);

  const dividers = useMemo(() => tileryDeriveDividers(state), [state]);
  const junctions = useMemo(() => tileryDeriveJunctions(state), [state]);
  const dividerAccessibility = useMemo(
    () => makeDividerAccessibilityMap(state, dividers, minSize, sizeContext),
    [dividers, minSize, sizeContext, state],
  );
  const fullScreenPanelId = useMemo(
    () => tileryGetFullScreenPanelId(state),
    [state],
  );

  const activeByPanelRef = useRef<Record<TileryPanelId, TileryTabId | null>>(
    {},
  );
  const activeByPanelFp = useRef<string>('');
  const activeByPanel = useMemo(() => {
    let fp = '';
    const next: Record<TileryPanelId, TileryTabId | null> = {};
    for (const pid of tileryAllPanelOrderFromState(state)) {
      const p = state.panels[pid];
      /* v8 ignore next */
      if (!p) continue;
      next[pid] = p.activeTabId;
      /* v8 ignore next */
      fp += pid + '=' + (p.activeTabId ?? '') + ';';
    }
    if (fp === activeByPanelFp.current) return activeByPanelRef.current;
    activeByPanelFp.current = fp;
    activeByPanelRef.current = next;
    return next;
  }, [state]);

  const onTabClick = useCallback((tabId: string) => {
    tileryRef.current?.setActiveTab(tabId);
  }, []);
  const onTabClose = useCallback((tabId: string) => {
    tileryRef.current?.removeTab(tabId);
  }, []);
  const onPanelPointerDown = useCallback(
    (_e: React.PointerEvent, panelId: string) => {
      tileryRef.current?.focusPanel(panelId);
    },
    [],
  );
  const onDividerDrag = useCallback(
    (
      dividerId: string,
      newPosition: number,
      input: 'keyboard' | 'pointer',
      nextSizeContext?: TilerySizeResolutionContext,
    ) => {
      return dispatchResize(
        {
          type: 'DIVIDER_RESIZE',
          dividerId,
          newPosition,
          minSize,
          sizeContext: nextSizeContext,
        },
        input,
      );
    },
    [dispatchResize, minSize],
  );
  const onDividerReset = useCallback(
    (dividerId: string, nextSizeContext?: TilerySizeResolutionContext) => {
      return dispatchResize(
        {
          type: 'DIVIDER_RESET',
          dividerId,
          minSize,
          sizeContext: nextSizeContext,
        },
        'pointer',
      );
    },
    [dispatchResize, minSize],
  );
  const onJunctionDrag = useCallback(
    (
      junctionId: string,
      x: number,
      y: number,
      input: 'pointer',
      nextSizeContext?: TilerySizeResolutionContext,
    ) => {
      return dispatchResize(
        {
          type: 'JUNCTION_RESIZE',
          junctionId,
          x,
          y,
          minSize,
          /* v8 ignore next -- pointer junction drags pass measured dimensions from the handle. */
          sizeContext: nextSizeContext ?? getSizeContext(),
        },
        input,
      );
    },
    [dispatchResize, getSizeContext, minSize],
  );
  const onEdgePanelDrag = useCallback(
    (
      panelId: TileryPanelId,
      size: number,
      input: 'pointer',
      nextSizeContext?: TilerySizeResolutionContext,
    ) => {
      return dispatchResize(
        {
          type: 'EDGE_PANEL_SIZE_SET',
          panelId,
          size,
          minSize,
          sizeContext: nextSizeContext,
        },
        input,
      );
    },
    [dispatchResize, minSize],
  );

  const renderHeaderAdapter = useCallback(
    (tab: TileryTab, ctx: { isActive: boolean }) =>
      renderTabHeader(tab as TileryTab<TData>, ctx),
    [renderTabHeader],
  );
  const renderTabTriggerAdapter = useCallback<TileryTabTriggerRenderer>(
    (ctx) =>
      renderTabTrigger!({
        ...ctx,
        tab: ctx.tab as TileryTab<TData>,
      }),
    [renderTabTrigger],
  );

  const panelEls = useRef<Map<TileryPanelId, HTMLElement>>(new Map());
  const panelCbCache = useRef<
    Map<TileryPanelId, (el: HTMLElement | null) => void>
  >(new Map());
  const tabBarCbCache = useRef<
    Map<TileryPanelId, (el: HTMLElement | null) => void>
  >(new Map());
  const tabCbRef = useRef<(tabId: string, el: HTMLElement | null) => void>(
    /* v8 ignore next */
    () => {},
  );
  tabCbRef.current = (tabId: string, el: HTMLElement | null) =>
    drag.registerTab(tabId, el);
  const stableRegisterTab = useCallback(
    (tabId: string, el: HTMLElement | null) => {
      tabCbRef.current(tabId, el);
    },
    [],
  );

  const getRegisterPanel = useCallback(
    (panelId: TileryPanelId) => {
      const cached = panelCbCache.current.get(panelId);
      if (cached) return cached;
      const cb = (el: HTMLElement | null) => {
        drag.registerPanel(panelId, el);
        if (el) panelEls.current.set(panelId, el);
        else panelEls.current.delete(panelId);
      };
      panelCbCache.current.set(panelId, cb);
      return cb;
    },
    [drag],
  );
  const getRegisterTabBar = useCallback(
    (panelId: TileryPanelId) => {
      const cached = tabBarCbCache.current.get(panelId);
      if (cached) return cached;
      const cb = (el: HTMLElement | null) => drag.registerTabBar(panelId, el);
      tabBarCbCache.current.set(panelId, cb);
      return cb;
    },
    [drag],
  );

  // Drop per-panel registration caches and content-slot entries when their
  // panel disappears (closed, split away, docked, or popped back) so these maps
  // don't grow unbounded across a long session of panel churn. The panel/tab
  // handle caches and tab hosts are pruned on access elsewhere; these
  // registration caches have no such access path once a panel is gone.
  useEffect(() => {
    const alive = new Set<TileryPanelId>(tileryAllPanelOrderFromState(state));
    for (const id of panelCbCache.current.keys()) {
      if (!alive.has(id)) panelCbCache.current.delete(id);
    }
    for (const id of tabBarCbCache.current.keys()) {
      if (!alive.has(id)) tabBarCbCache.current.delete(id);
    }
    for (const id of slotCbCache.current.keys()) {
      if (!alive.has(id)) slotCbCache.current.delete(id);
    }
    setContentSlots((prev) => {
      const ids = Object.keys(prev);
      if (ids.every((id) => alive.has(id))) return prev;
      const next: Record<TileryPanelId, HTMLElement | null> = {};
      for (const id of ids) {
        if (alive.has(id)) next[id] = prev[id];
      }
      return next;
    });
  }, [state]);

  const tiledPanelIds = useMemo(
    () => tileryPanelOrderFromState(state),
    [state],
  );
  const edgePanelIds = useMemo(
    () => tileryEdgePanelOrderFromState(state),
    [state],
  );
  const floatingPanelIds = useMemo(
    () => tileryFloatingPanelOrderFromState(state),
    [state],
  );
  const edgeSizes = useMemo(() => tileryEdgePanelSizes(state), [state]);
  const mainLayerStyle = useMemo(
    () => edgeMainLayerStyle(edgeSizes),
    [edgeSizes],
  );

  const tabPortals = useMemo(() => {
    return Object.values(state.tabs).map((tabState) => {
      const host = ensureTabHost(tabState.id);
      /* v8 ignore next */
      if (!host) return null;
      const isActive = activeByPanel[tabState.panelId] === tabState.id;
      const tab = getCachedTab(tabState.id);
      /* v8 ignore next */
      if (!tab) return null;
      return createPortal(
        <div className="tilery__tab-content" data-active={isActive}>
          {renderTabContent(tab as TileryTab<TData>)}
        </div>,
        host,
        tabState.id,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tabs, activeByPanel, renderTabContent, getCachedTab]);

  const renderPanel = (
    panelId: TileryPanelId,
    placementStyle?: React.CSSProperties,
  ) => {
    const panel = getCachedPanel(panelId);
    /* v8 ignore next */
    if (!panel) return null;
    const popoutRoot = panel.poppedOut ? popoutRoots[panelId] : null;
    const panelChrome = (
      <PanelChrome
        key={panelId}
        panel={panel}
        tilery={tileryRef.current!}
        renderHeader={renderHeaderAdapter}
        renderTabTrigger={
          renderTabTrigger ? renderTabTriggerAdapter : undefined
        }
        registerPanel={getRegisterPanel(panelId)}
        registerContentSlot={getRegisterContentSlot(panelId)}
        popoutWindow={Boolean(popoutRoot)}
        placementStyle={placementStyle}
        registerTabBar={getRegisterTabBar(panelId)}
        registerTab={stableRegisterTab}
        onPanelPointerDown={onPanelPointerDown}
        onFloatingResizePointerDown={floatingDrag.onFloatingResizePointerDown}
        onTabPointerDown={drag.onTabPointerDown}
        onTabPointerMove={floatingDrag.onPointerMove}
        onTabPointerUp={drag.onTabPointerUp}
        onTabPointerCancel={floatingDrag.onPointerCancel}
        onTabBarPointerDown={drag.onTabBarPointerDown}
        onFloatingTabBarPointerDown={floatingDrag.onFloatingTabBarPointerDown}
        onTabBarPointerUp={floatingDrag.onTabBarPointerUp}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        showActionsButton={resolvePanelVisibility(showActionsButton, panel)}
        showNewTabButton={resolvePanelVisibility(showNewTabButton, panel)}
        onNewTab={onNewTab}
        renderPanelActions={renderPanelActions}
        renderActionsButtonIcon={renderActionsButtonIcon}
      />
    );
    if (panel.poppedOut) {
      return popoutRoot
        ? createPortal(panelChrome, popoutRoot, `popout-${panelId}`)
        : null;
    }
    return panelChrome;
  };

  return (
    <div className="tilery">
      <div ref={rootContainerRef} className="tilery__inner">
        {fullScreenPanelId
          ? renderPanel(fullScreenPanelId)
          : edgePanelIds.map((panelId) => {
              const panel = state.panels[panelId];
              /* v8 ignore next -- edgePanelIds only references existing edge panels. */
              if (!panel || panel.kind !== 'edge') return null;
              return renderPanel(
                panelId,
                edgePanelPlacementStyle(panel.edge.side, edgeSizes),
              );
            })}

        <div
          ref={mainContainerRef}
          className="tilery__main-layer"
          style={mainLayerStyle}>
          {!fullScreenPanelId &&
            tiledPanelIds.map((panelId) => renderPanel(panelId))}

          {!fullScreenPanelId &&
            dividers.map((d) => (
              <TileryDivider
                key={d.id}
                divider={d}
                accessibility={dividerAccessibility[d.id]!}
                disabled={!resizable || d.disabled}
                hitSize={resizeHandleHitSize}
                onDrag={onDividerDrag}
                onReset={onDividerReset}
                onDragEnd={commitResize}
                containerRef={mainContainerRef}
              />
            ))}

          {!fullScreenPanelId &&
            junctions.map((junction) => (
              <TileryJunction
                key={junction.id}
                junction={junction}
                disabled={!resizable || junction.disabled}
                hitSize={resizeHandleHitSize}
                onDrag={onJunctionDrag}
                onDragEnd={commitResize}
                containerRef={mainContainerRef}
              />
            ))}
        </div>

        {!fullScreenPanelId &&
          floatingPanelIds.map((panelId) => renderPanel(panelId))}

        {!fullScreenPanelId &&
          edgePanelIds.map((panelId) => {
            const panel = state.panels[panelId];
            /* v8 ignore next -- edgePanelIds only references existing edge panels. */
            if (!panel || panel.kind !== 'edge') return null;
            const behavior = tileryPanelBehaviorFromState(state, panelId);
            return (
              <EdgeResizeHandle
                key={`edge-resize-${panelId}`}
                panelId={panelId}
                side={panel.edge.side}
                disabled={!resizable || !behavior.resizable}
                hitSize={resizeHandleHitSize}
                placementStyle={edgeResizeHandleStyle(
                  panel.edge.side,
                  edgeSizes,
                  resizeHandleHitSize,
                )}
                onDrag={onEdgePanelDrag}
                onDragEnd={commitResize}
                containerRef={rootContainerRef}
              />
            );
          })}

        {tabPortals}

        {drag.dragState &&
          (() => {
            const draggedTab = getCachedTab(drag.dragState.tabId);
            const siblingCount = drag.panelDragRef.current
              ? draggedTab
                ? draggedTab.panel.tabs.length - 1
                : 0
              : 0;
            const ghostLabel = draggedTab ? (
              <>
                {renderHeaderAdapter(draggedTab, { isActive: false })}
                {siblingCount > 0 && (
                  <span className="tilery__drag-ghost-count">
                    +{siblingCount}
                  </span>
                )}
              </>
            ) : (
              'Tab'
            );
            return (
              <DropOverlay
                drag={drag.dragState}
                containerRef={rootContainerRef}
                panelEls={panelEls.current}
                ghostLabel={ghostLabel}
              />
            );
          })()}
      </div>
    </div>
  );
}) as <TData = unknown>(
  props: TileryProps<TData> & { ref?: React.Ref<TileryController> },
) => React.ReactElement;

/** Resolves a panel-visibility value to a boolean for a specific panel. */
function resolvePanelVisibility(
  value: TileryPanelVisibility,
  panel: TileryPanel,
): boolean {
  return typeof value === 'function' ? value(panel) : value;
}

/** Insets the main layer so edge panels occupy the container's margins. */
function edgeMainLayerStyle(
  sizes: Record<TileryEdge, number>,
): React.CSSProperties {
  return {
    top: `${sizes.top}%`,
    right: `${sizes.right}%`,
    bottom: `${sizes.bottom}%`,
    left: `${sizes.left}%`,
  };
}

/** Computes the absolute placement style for an edge panel on a given side. */
function edgePanelPlacementStyle(
  side: TileryEdge,
  sizes: Record<TileryEdge, number>,
): React.CSSProperties {
  if (side === 'left') {
    return {
      top: `${sizes.top}%`,
      bottom: `${sizes.bottom}%`,
      left: '0%',
      width: `${sizes.left}%`,
    };
  }
  if (side === 'right') {
    return {
      top: `${sizes.top}%`,
      right: '0%',
      bottom: `${sizes.bottom}%`,
      width: `${sizes.right}%`,
    };
  }
  if (side === 'top') {
    return {
      top: '0%',
      right: '0%',
      left: '0%',
      height: `${sizes.top}%`,
    };
  }
  return {
    right: '0%',
    bottom: '0%',
    left: '0%',
    height: `${sizes.bottom}%`,
  };
}

/** Positions an edge panel's resize handle centered over its boundary. */
function edgeResizeHandleStyle(
  side: TileryEdge,
  sizes: Record<TileryEdge, number>,
  hitSize: number | undefined,
): React.CSSProperties {
  const resolvedHitSize = normalizeResizeHitSize(hitSize);
  if (side === 'left') {
    return {
      top: `${sizes.top}%`,
      bottom: `${sizes.bottom}%`,
      left: `calc(${sizes.left}% - ${resolvedHitSize / 2}px)`,
      width: resolvedHitSize,
      cursor: 'col-resize',
    };
  }
  if (side === 'right') {
    return {
      top: `${sizes.top}%`,
      bottom: `${sizes.bottom}%`,
      left: `calc(${100 - sizes.right}% - ${resolvedHitSize / 2}px)`,
      width: resolvedHitSize,
      cursor: 'col-resize',
    };
  }
  if (side === 'top') {
    return {
      top: `calc(${sizes.top}% - ${resolvedHitSize / 2}px)`,
      right: '0%',
      left: '0%',
      height: resolvedHitSize,
      cursor: 'row-resize',
    };
  }
  return {
    top: `calc(${100 - sizes.bottom}% - ${resolvedHitSize / 2}px)`,
    right: '0%',
    left: '0%',
    height: resolvedHitSize,
    cursor: 'row-resize',
  };
}

/** Falls back to the default hit size when none is provided or invalid. */
function normalizeResizeHitSize(value: number | undefined): number {
  return Number.isFinite(value) && value! > 0 ? value! : 24;
}

/** Builds a resize event from the action's source and panel size changes. */
function makeResizeEvent(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryResizeAction,
  input: TileryResizeInput,
  container: HTMLElement | null,
): TileryResizeEvent | null {
  const source = makeResizeSource(previousState, state, action);
  /* v8 ignore next -- UI resize actions always target a rendered handle. */
  if (!source) return null;
  const changes = makeResizePanelChanges(previousState, state, container);
  if (changes.length === 0) return null;
  return {
    phase: 'resize',
    input,
    source,
    changes,
    previousState,
    state,
  };
}

/** Derives the resize source (divider, junction, or edge) for an action. */
function makeResizeSource(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryResizeAction,
): TileryResizeSource | null {
  if (action.type === 'DIVIDER_RESIZE' || action.type === 'DIVIDER_RESET') {
    const previousDivider = tileryDeriveDividers(previousState).find(
      (divider) => divider.id === action.dividerId,
    );
    /* v8 ignore next -- guarded by rendered divider ids. */
    if (!previousDivider) return null;
    const nextDivider = tileryDeriveDividers(state).find(
      (item) => item.id === action.dividerId,
    );
    /* v8 ignore next -- successful divider resizes keep the divider rendered. */
    const divider = nextDivider ?? previousDivider;
    return {
      type: 'divider',
      dividerId: action.dividerId,
      orientation: previousDivider.orientation,
      previousPosition: previousDivider.position,
      position: divider.position,
    };
  }

  if (action.type === 'EDGE_PANEL_SIZE_SET') {
    const previousPanel = previousState.panels[action.panelId];
    const panel = state.panels[action.panelId];
    /* v8 ignore next -- EDGE_PANEL_SIZE_SET always targets an existing edge panel. */
    if (!previousPanel || previousPanel.kind !== 'edge') return null;
    /* v8 ignore next 2 -- the edge panel still exists immediately after its own resize. */
    const size =
      panel?.kind === 'edge' ? panel.edge.size : previousPanel.edge.size;
    return {
      type: 'edge',
      panelId: action.panelId,
      side: previousPanel.edge.side,
      previousSize: previousPanel.edge.size,
      size,
    };
  }

  const previousJunction = tileryDeriveJunctions(previousState).find(
    (junction) => junction.id === action.junctionId,
  );
  /* v8 ignore next -- guarded by rendered junction ids. */
  if (!previousJunction) return null;
  const nextJunction = tileryDeriveJunctions(state).find(
    (item) => item.id === action.junctionId,
  );
  /* v8 ignore next -- successful junction resizes keep the junction rendered. */
  const junction = nextJunction ?? previousJunction;
  return {
    type: 'junction',
    junctionId: action.junctionId,
    previousX: previousJunction.x,
    previousY: previousJunction.y,
    x: junction.x,
    y: junction.y,
    verticalDividerId: previousJunction.verticalDividerId,
    horizontalDividerId: previousJunction.horizontalDividerId,
  };
}

/** Collects per-panel size deltas (percent and pixels) between two states. */
function makeResizePanelChanges(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  container: HTMLElement | null,
): TileryResizePanelChange[] {
  const rect = container?.getBoundingClientRect();
  const changes: TileryResizePanelChange[] = [];
  for (const panelId of tileryAllPanelOrderFromState(state)) {
    const previousPanel = previousState.panels[panelId];
    const panel = state.panels[panelId];
    /* v8 ignore next -- resize operations do not create panels. */
    if (!previousPanel || !panel) continue;
    for (const dimension of resizeDimensions) {
      const previousSize = panelSize(previousPanel, dimension);
      const size = panelSize(panel, dimension);
      if (Math.abs(size - previousSize) < 0.0001) continue;
      const previousPixelSize = panelPixelSize(previousSize, dimension, rect);
      const pixelSize = panelPixelSize(size, dimension, rect);
      changes.push({
        panelId,
        dimension,
        previousSize,
        size,
        ...(previousPixelSize == null ? {} : { previousPixelSize }),
        ...(pixelSize == null ? {} : { pixelSize }),
      });
    }
  }
  return changes;
}

/** The two axes scanned when reporting panel size changes. */
const resizeDimensions: TileryResizeDimension[] = ['width', 'height'];

/** Returns a panel's axis size as a percentage, derived from its insets. */
function panelSize(
  panel: NonNullable<TileryLayoutState['panels'][string]>,
  dimension: TileryResizeDimension,
): number {
  const size =
    dimension === 'width'
      ? 100 - panel.inset.left - panel.inset.right
      : 100 - panel.inset.top - panel.inset.bottom;
  return roundResizeSize(size);
}

/** Converts a percentage size to pixels using the container rect, if known. */
function panelPixelSize(
  size: number,
  dimension: TileryResizeDimension,
  rect: DOMRect | undefined,
): number | undefined {
  /* v8 ignore next -- mounted Tilery resize events always have a container. */
  if (!rect) return undefined;
  const containerSize = dimension === 'width' ? rect.width : rect.height;
  if (containerSize <= 0) return undefined;
  return roundResizeSize((size / 100) * containerSize);
}

/** Rounds a size to four decimals to keep reported values stable. */
function roundResizeSize(size: number): number {
  return Number(size.toFixed(4));
}

/** Builds the accessibility descriptor for every divider, keyed by id. */
function makeDividerAccessibilityMap(
  state: TileryLayoutState,
  dividers: TileryDividerState[],
  minSize: TilerySize,
  sizeContext: TilerySizeResolutionContext,
): Record<string, DividerAccessibility> {
  const result: Record<string, DividerAccessibility> = {};
  for (const divider of dividers) {
    result[divider.id] = makeDividerAccessibility(
      state,
      divider,
      minSize,
      sizeContext,
    );
  }
  return result;
}

/** Computes ARIA range/label values for a single resize divider. */
function makeDividerAccessibility(
  state: TileryLayoutState,
  divider: TileryDividerState,
  minSize: TilerySize,
  sizeContext: TilerySizeResolutionContext,
): DividerAccessibility {
  const panels = [...divider.beforePanels, ...divider.afterPanels].map(
    (id) => state.panels[id]!,
  );
  const axisStart =
    divider.orientation === 'vertical'
      ? Math.min(...panels.map((panel) => panel.inset.left))
      : Math.min(...panels.map((panel) => panel.inset.top));
  const axisEnd =
    divider.orientation === 'vertical'
      ? Math.max(...panels.map((panel) => 100 - panel.inset.right))
      : Math.max(...panels.map((panel) => 100 - panel.inset.bottom));
  const minPosition = tileryClampDividerPosition(
    state,
    divider,
    0,
    minSize,
    sizeContext,
  );
  const maxPosition = tileryClampDividerPosition(
    state,
    divider,
    100,
    minSize,
    sizeContext,
  );
  const valueMin = dividerValue(minPosition, axisStart, axisEnd);
  const valueMax = dividerValue(maxPosition, axisStart, axisEnd);
  const valueNow = dividerValue(divider.position, axisStart, axisEnd);

  return {
    label: `Resize ${divider.beforePanels.join(', ')} pane`,
    controls: divider.beforePanels.map(tileryPanelDomId).join(' '),
    valueMin: Math.min(valueMin, valueMax),
    valueMax: Math.max(valueMin, valueMax),
    valueNow,
    valueText: `${valueNow}%`,
    minPosition,
    maxPosition,
    axisStart,
    axisEnd,
  };
}

/** Maps a divider position onto a 0-100 value within its travel range. */
function dividerValue(
  position: number,
  axisStart: number,
  axisEnd: number,
): number {
  return Number(
    (((position - axisStart) / (axisEnd - axisStart)) * 100).toFixed(2),
  );
}

/** Reads a container's pixel size, omitting zero dimensions. */
function measureContainer(
  container: HTMLDivElement | null,
): TilerySizeResolutionContext {
  /* v8 ignore next -- callers use this before mount defensively. */
  if (!container) return {};
  const rect = container.getBoundingClientRect();
  return {
    width: rect.width > 0 ? rect.width : undefined,
    height: rect.height > 0 ? rect.height : undefined,
  };
}

/** Compares two size contexts by width and height. */
function sizeContextEqual(
  left: TilerySizeResolutionContext,
  right: TilerySizeResolutionContext,
) {
  return left.width === right.width && left.height === right.height;
}
