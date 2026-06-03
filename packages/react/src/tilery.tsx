'use client';

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

export type TileryPanelVisibility = boolean | ((panel: TileryPanel) => boolean);

export type TileryNewTabHandler<TData = unknown> = (
  panel: TileryPanel,
  ctx: { tilery: TileryController },
) => TileryTabInit<TData> | void;

export type TileryPanelActionsRenderContext = {
  tilery: TileryController;
  closeMenu: () => void;
};

export type TileryTabTriggerProps = React.HTMLAttributes<HTMLElement> & {
  ref: React.RefCallback<HTMLElement>;
  className: string;
  role: 'tab';
  'aria-selected': boolean;
  'data-active': boolean;
  'data-closable': boolean;
  'data-draggable': boolean;
  'data-tab-id': TileryTabId;
};

export type TileryTabTriggerRenderContext<TData = unknown> = {
  tab: TileryTab<TData>;
  isActive: boolean;
  props: TileryTabTriggerProps;
  children: React.ReactNode;
};

export type TileryTabTriggerRenderer<TData = unknown> = (
  ctx: TileryTabTriggerRenderContext<TData>,
) => React.ReactElement;

export type TileryResizeInput = 'keyboard' | 'pointer';
export type TileryResizePhase = 'resize' | 'end';
export type TileryResizeDimension = 'width' | 'height';

export type TileryResizePanelChange = {
  panelId: TileryPanelId;
  dimension: TileryResizeDimension;
  previousSize: number;
  size: number;
  previousPixelSize?: number;
  pixelSize?: number;
};

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

export type TileryResizeEvent = {
  phase: TileryResizePhase;
  input: TileryResizeInput;
  source: TileryResizeSource;
  changes: TileryResizePanelChange[];
  previousState: TileryLayoutState;
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

export type TileryProps<TData = unknown> = {
  initialLayout: TileryInitialLayout<TData>;
  renderTabHeader: (
    tab: TileryTab<TData>,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  renderTabTrigger?: TileryTabTriggerRenderer<TData>;
  renderTabContent: (tab: TileryTab<TData>) => React.ReactNode;
  onChange?: (state: TileryLayoutState) => void;
  onResize?: (event: TileryResizeEvent) => void;
  onResizeEnd?: (event: TileryResizeEvent) => void;
  onActiveTabChange?: (event: TileryActiveTabChangeEvent) => void;
  onTabsMove?: (event: TileryTabsMoveEvent<TData>) => void;
  onPanelsOpen?: (event: TileryPanelsOpenEvent<TData>) => void;
  onPanelSplit?: (event: TileryPanelSplitEvent<TData>) => void;
  onTabsOpen?: (event: TileryTabsOpenEvent<TData>) => void;
  onTabsClose?: (event: TileryTabsCloseEvent<TData>) => void;
  onPanelsClose?: (event: TileryPanelsCloseEvent<TData>) => void;
  minSize?: TilerySize;
  resizable?: boolean;
  resizeHandleHitSize?: number;
  showActionsButton?: TileryPanelVisibility;
  showNewTabButton?: TileryPanelVisibility;
  onNewTab?: TileryNewTabHandler<TData>;
  renderPanelActions?: (
    panel: TileryPanel,
    ctx: TileryPanelActionsRenderContext,
  ) => React.ReactNode;
  renderActionsButtonIcon?: (panel: TileryPanel) => React.ReactNode;
};

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

function resolvePanelVisibility(
  value: TileryPanelVisibility,
  panel: TileryPanel,
): boolean {
  return typeof value === 'function' ? value(panel) : value;
}

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

function normalizeResizeHitSize(value: number | undefined): number {
  return Number.isFinite(value) && value! > 0 ? value! : 24;
}

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
    if (!previousPanel || previousPanel.kind !== 'edge') return null;
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

const resizeDimensions: TileryResizeDimension[] = ['width', 'height'];

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

function roundResizeSize(size: number): number {
  return Number(size.toFixed(4));
}

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

function dividerValue(
  position: number,
  axisStart: number,
  axisEnd: number,
): number {
  return Number(
    (((position - axisStart) / (axisEnd - axisStart)) * 100).toFixed(2),
  );
}

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

function sizeContextEqual(
  left: TilerySizeResolutionContext,
  right: TilerySizeResolutionContext,
) {
  return left.width === right.width && left.height === right.height;
}
