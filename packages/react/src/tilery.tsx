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
import {
  PanelChrome,
  type TileryFloatingResizeEdge,
} from './components/panel-chrome';
import { TileryDivider, type DividerAccessibility } from './components/divider';
import { TileryJunction } from './components/junction';
import { DropOverlay } from './components/drop-overlay';
import { tileryPanelDomId } from './dom-ids';
import { useTileryDragController } from './use-drag-controller';
import {
  tileryCreateInitialState,
  tileryReducer,
  makeTileryHandle,
  tileryAllPanelOrderFromState,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryGetFullScreenPanelId,
  tileryPanelBehaviorFromState,
  tileryWarnForConstraintDiagnostics,
  type TileryReducerAction,
  type TileryDirection,
  type TileryInitialLayout,
  type TileryDivider as TileryDividerState,
  type TileryDividerOrientation,
  type TileryFloatingPanelBounds,
  type TileryLayoutState,
  type TileryHandle,
  type TileryPanelHandle,
  type TileryPanelId,
  type TileryPopoutPanelOptions,
  type TileryPopoutWindowBounds,
  type TilerySize,
  type TilerySizeResolutionContext,
  type TileryTabHandle,
  type TileryTabId,
  type TileryTabInit,
} from 'tilery/internal';

import 'tilery/style.css';

export type TileryPanelVisibility =
  | boolean
  | ((panel: TileryPanelHandle) => boolean);

export type TileryNewTabHandler<TData = unknown> = (
  panel: TileryPanelHandle,
  ctx: { tilery: TileryHandle },
) => TileryTabInit<TData> | void;

export type TileryPanelActionsRenderContext = {
  tilery: TileryHandle;
  closeMenu: () => void;
};

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
    };

export type TileryResizeEvent = {
  phase: TileryResizePhase;
  input: TileryResizeInput;
  source: TileryResizeSource;
  changes: TileryResizePanelChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryLifecycleSource =
  | 'SPLIT_PANEL'
  | 'REMOVE_PANEL'
  | 'APPEND_TAB'
  | 'INSERT_TAB'
  | 'REMOVE_TAB'
  | 'MOVE_TAB'
  | 'FLOAT_TAB'
  | 'POPOUT_TAB'
  | 'SET_ACTIVE_TAB'
  | 'REPLACE_STATE';

export type TileryTabLifecycleChange<TData = unknown> = {
  id: TileryTabId;
  panelId: TileryPanelId;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

export type TileryPanelLifecycleChange = {
  id: TileryPanelId;
  tabIds: TileryTabId[];
  activeTabId: TileryTabId | null;
};

export type TileryActiveTabChange = {
  panelId: TileryPanelId;
  previousTabId: TileryTabId | null;
  tabId: TileryTabId | null;
};

export type TileryTabMoveChange<TData = unknown> = {
  id: TileryTabId;
  previousPanelId: TileryPanelId;
  panelId: TileryPanelId;
  previousIndex: number;
  index: number;
  data: TData;
  closeable: boolean;
  draggable: boolean;
};

export type TileryActiveTabChangeEvent = {
  source: TileryLifecycleSource;
  changes: TileryActiveTabChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsMoveEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabMoveChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelsOpenEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelSplitEvent<TData = unknown> = {
  source: 'SPLIT_PANEL' | 'MOVE_TAB';
  splitPanelId: TileryPanelId;
  createdPanelId: TileryPanelId;
  direction: TileryDirection;
  size: number;
  splitPanel: TileryPanelLifecycleChange;
  createdPanel: TileryPanelLifecycleChange;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsOpenEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryTabsCloseEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  tabs: TileryTabLifecycleChange<TData>[];
  panels: TileryPanelLifecycleChange[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

export type TileryPanelsCloseEvent<TData = unknown> = {
  source: TileryLifecycleSource;
  panels: TileryPanelLifecycleChange[];
  tabs: TileryTabLifecycleChange<TData>[];
  previousState: TileryLayoutState;
  state: TileryLayoutState;
};

type TileryLifecycleEvents<TData = unknown> = {
  activeTabChange: TileryActiveTabChangeEvent | null;
  tabsMove: TileryTabsMoveEvent<TData> | null;
  panelsOpen: TileryPanelsOpenEvent<TData> | null;
  panelSplit: TileryPanelSplitEvent<TData> | null;
  tabsOpen: TileryTabsOpenEvent<TData> | null;
  tabsClose: TileryTabsCloseEvent<TData> | null;
  panelsClose: TileryPanelsCloseEvent<TData> | null;
};

type TileryResizeAction = Extract<
  TileryReducerAction,
  { type: 'RESIZE_DIVIDER' | 'RESIZE_JUNCTION' }
>;

type TileryFloatingPanelDragState = {
  panelId: TileryPanelId;
  pointerId: number;
  edge?: TileryFloatingResizeEdge;
  startX: number;
  startY: number;
  startBounds: TileryFloatingPanelBounds;
  containerWidth: number;
  containerHeight: number;
};

type TileryPopoutWindowRecord = {
  win: Window;
  root: HTMLElement;
  closing: boolean;
  cleanup: () => void;
};

export type TileryProps<TData = unknown> = {
  initialLayout: TileryInitialLayout<TData>;
  renderTabHeader: (
    tab: TileryTabHandle<TData>,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  renderTabContent: (tab: TileryTabHandle<TData>) => React.ReactNode;
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
    panel: TileryPanelHandle,
    ctx: TileryPanelActionsRenderContext,
  ) => React.ReactNode;
  renderActionsButtonIcon?: (panel: TileryPanelHandle) => React.ReactNode;
};

export const Tilery = forwardRef(function Tilery<TData = unknown>(
  props: TileryProps<TData>,
  ref: React.Ref<TileryHandle>,
) {
  const {
    initialLayout,
    renderTabHeader,
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoutWindowsRef = useRef<Map<TileryPanelId, TileryPopoutWindowRecord>>(
    new Map(),
  );
  const [popoutRoots, setPopoutRoots] = useState<
    Record<TileryPanelId, HTMLElement | null>
  >({});
  const [sizeContext, setSizeContext] = useState<TilerySizeResolutionContext>(
    {},
  );
  const getSizeContext = useCallback(
    () => measureContainer(containerRef.current),
    [],
  );
  const normalizeContainerSize = useCallback(
    (nextSizeContext: TilerySizeResolutionContext) => {
      const action: TileryReducerAction = {
        type: 'NORMALIZE_CONTAINER_SIZE',
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
    const container = containerRef.current;
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
      const event = makeResizeEvent(
        previousState,
        nextState,
        resizeAction,
        input,
        containerRef.current,
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

  const setPopoutRoot = useCallback(
    (panelId: TileryPanelId, root: HTMLElement | null) => {
      setPopoutRoots((prev) => {
        /* v8 ignore next -- popout roots are only set when they change. */
        if (prev[panelId] === root) return prev;
        if (!root) {
          const { [panelId]: _drop, ...next } = prev;
          return next;
        }
        return { ...prev, [panelId]: root };
      });
    },
    [],
  );

  const syncPopoutWindowBounds = useCallback(
    (panelId: TileryPanelId) => {
      const record = popoutWindowsRef.current.get(panelId);
      if (!record || record.win.closed) return;
      const bounds = readPopoutWindowBounds(record.win);
      dispatchWithLifecycle({
        type: 'SET_POPOUT_WINDOW_BOUNDS',
        panelId,
        bounds,
      });
    },
    [dispatchWithLifecycle],
  );

  const closePopoutWindow = useCallback(
    (panelId: TileryPanelId) => {
      const record = popoutWindowsRef.current.get(panelId);
      if (!record) return;
      record.closing = true;
      record.cleanup();
      popoutWindowsRef.current.delete(panelId);
      setPopoutRoot(panelId, null);
      if (!record.win.closed) {
        record.win.close();
      }
    },
    [setPopoutRoot],
  );

  const requestPopoutPanel = useCallback(
    (panelId: TileryPanelId, opts?: TileryPopoutPanelOptions): boolean => {
      const existing = popoutWindowsRef.current.get(panelId);
      if (existing && !existing.win.closed) {
        existing.win.focus();
        return true;
      }

      /* v8 ignore next 3 -- React DOM popout requests always have an owner window. */
      const ownerWindow =
        containerRef.current?.ownerDocument.defaultView ??
        (typeof window === 'undefined' ? null : window);
      /* v8 ignore next -- covered by the owner-window invariant above. */
      if (!ownerWindow) return false;
      const fallbackBounds = defaultPopoutWindowBounds(ownerWindow);
      const bounds = normalizePopoutWindowBounds(
        opts?.windowBounds,
        fallbackBounds,
      );
      const features = popoutFeatureString(bounds);
      const win = ownerWindow.open('', `tilery-popout-${panelId}`, features);
      if (!win) return false;

      const root = preparePopoutDocument(win, containerRef.current, panelId);
      if (!root) {
        win.close();
        return false;
      }

      const handleBeforeUnload = () => {
        const record = popoutWindowsRef.current.get(panelId);
        /* v8 ignore next -- cleanup removes this listener with the record. */
        if (!record) return;
        syncPopoutWindowBounds(panelId);
        /* v8 ignore next -- close cleanup removes this listener first. */
        if (!record.closing) {
          dispatchWithLifecycle({
            type: 'RETURN_PANEL_TO_FLOATING',
            panelId,
          });
        }
      };
      const handleResize = () => syncPopoutWindowBounds(panelId);
      const handleFocus = () => {
        dispatchWithLifecycle({ type: 'FOCUS_PANEL', panelId });
      };
      win.addEventListener('beforeunload', handleBeforeUnload);
      win.addEventListener('resize', handleResize);
      win.addEventListener('focus', handleFocus);
      popoutWindowsRef.current.set(panelId, {
        win,
        root,
        closing: false,
        cleanup: () => {
          win.removeEventListener('beforeunload', handleBeforeUnload);
          win.removeEventListener('resize', handleResize);
          win.removeEventListener('focus', handleFocus);
        },
      });
      setPopoutRoot(panelId, root);
      win.focus();
      return true;
    },
    [dispatchWithLifecycle, setPopoutRoot, syncPopoutWindowBounds],
  );

  const returnPopoutPanelToFloating = useCallback(
    (panelId: TileryPanelId) => {
      closePopoutWindow(panelId);
    },
    [closePopoutWindow],
  );

  const tileryRef = useRef<TileryHandle | null>(null);
  if (!tileryRef.current) {
    tileryRef.current = makeTileryHandle(
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

  const panelHandleCache = useRef<Map<TileryPanelId, TileryPanelHandle>>(
    new Map(),
  );
  const getCachedPanelHandle = useCallback(
    (id: TileryPanelId): TileryPanelHandle | null => {
      /* v8 ignore next 4 */
      if (!stateRef.current.panels[id]) {
        panelHandleCache.current.delete(id);
        return null;
      }
      const cached = panelHandleCache.current.get(id);
      if (cached) return cached;
      const fresh = tileryRef.current!.getPanel(id);
      /* v8 ignore next */
      if (!fresh) return null;
      panelHandleCache.current.set(id, fresh);
      return fresh;
    },
    [],
  );
  const tabHandleCache = useRef<Map<TileryTabId, TileryTabHandle>>(new Map());
  const getCachedTabHandle = useCallback(
    (id: TileryTabId): TileryTabHandle | null => {
      if (!stateRef.current.tabs[id]) {
        tabHandleCache.current.delete(id);
        return null;
      }
      const cached = tabHandleCache.current.get(id);
      if (cached) return cached;
      const fresh = tileryRef.current!.getTab(id);
      /* v8 ignore next */
      if (!fresh) return null;
      tabHandleCache.current.set(id, fresh);
      return fresh;
    },
    [],
  );

  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  useEffect(() => {
    const poppedOut = new Set<TileryPanelId>();
    for (const panelId of tileryAllPanelOrderFromState(state)) {
      const panel = state.panels[panelId];
      if (panel?.kind === 'floating' && panel.floating.popout) {
        poppedOut.add(panelId);
        const record = popoutWindowsRef.current.get(panelId);
        if (!record || record.win.closed) {
          const ok = requestPopoutPanel(panelId, {
            windowBounds: panel.floating.popout.windowBounds,
          });
          if (!ok) {
            dispatchWithLifecycle({
              type: 'RETURN_PANEL_TO_FLOATING',
              panelId,
            });
          }
        }
      }
    }

    const openPanelIds = Array.from(popoutWindowsRef.current.keys());
    for (const panelId of openPanelIds) {
      if (!poppedOut.has(panelId)) closePopoutWindow(panelId);
    }
  }, [closePopoutWindow, dispatchWithLifecycle, requestPopoutPanel, state]);

  useEffect(() => {
    return () => {
      const openPanelIds = Array.from(popoutWindowsRef.current.keys());
      for (const panelId of openPanelIds) {
        closePopoutWindow(panelId);
      }
    };
  }, [closePopoutWindow]);

  const drag = useTileryDragController(() => tileryRef.current);
  const floatingDragRef = useRef<TileryFloatingPanelDragState | null>(null);

  const [limboEl] = useState(() => {
    /* v8 ignore next */
    if (typeof document === 'undefined') return null;
    const div = document.createElement('div');
    div.className = 'tilery__limbo';
    div.setAttribute('aria-hidden', 'true');
    return div;
  });
  useEffect(() => {
    const container = containerRef.current;
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
  const onFloatingTabBarPointerDown = useCallback(
    (e: React.PointerEvent, panelId: string) => {
      if (e.button !== 0) return;
      const panel = tileryRef.current?.getPanel(panelId);
      const bounds = panel?.floatingBounds;
      const container = containerRef.current;
      if (!panel?.floating || !bounds || !container) return;
      panel.focus();
      const behavior = tileryPanelBehaviorFromState(
        tileryRef.current!.getState(),
        panelId,
      );
      if (!behavior.draggable) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      e.preventDefault();
      floatingDragRef.current = {
        panelId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: { ...bounds },
        containerWidth: rect.width,
        containerHeight: rect.height,
      };
    },
    [],
  );
  const onFloatingResizePointerDown = useCallback(
    (
      e: React.PointerEvent,
      panelId: string,
      edge: TileryFloatingResizeEdge,
    ) => {
      if (e.button !== 0) return;
      const panel = tileryRef.current?.getPanel(panelId);
      const bounds = panel?.floatingBounds;
      const container = containerRef.current;
      if (!panel?.floating || !bounds || !container) return;
      panel.focus();
      const behavior = tileryPanelBehaviorFromState(
        tileryRef.current!.getState(),
        panelId,
      );
      if (!behavior.resizable) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      e.preventDefault();
      e.stopPropagation();
      floatingDragRef.current = {
        panelId,
        pointerId: e.pointerId,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: { ...bounds },
        containerWidth: rect.width,
        containerHeight: rect.height,
      };
    },
    [],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const floatingDrag = floatingDragRef.current;
      if (!floatingDrag || floatingDrag.pointerId !== e.pointerId) {
        drag.onTabPointerMove(e);
        return;
      }
      const dx =
        ((e.clientX - floatingDrag.startX) / floatingDrag.containerWidth) * 100;
      const dy =
        ((e.clientY - floatingDrag.startY) / floatingDrag.containerHeight) *
        100;
      const nextBounds = floatingDrag.edge
        ? resizeFloatingBounds(
            floatingDrag.startBounds,
            floatingDrag.edge,
            dx,
            dy,
          )
        : {
            ...floatingDrag.startBounds,
            x: floatingDrag.startBounds.x + dx,
            y: floatingDrag.startBounds.y + dy,
          };
      tileryRef.current?.setFloatingPanelBounds(
        floatingDrag.panelId,
        nextBounds,
      );
    },
    [drag],
  );
  const onTabBarPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const floatingDrag = floatingDragRef.current;
      if (floatingDrag?.pointerId === e.pointerId) {
        floatingDragRef.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }
      drag.onTabBarPointerUp(e);
    },
    [drag],
  );
  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (floatingDragRef.current?.pointerId === e.pointerId) {
        floatingDragRef.current = null;
      }
      drag.onTabPointerCancel(e);
    },
    [drag],
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
          type: 'RESIZE_DIVIDER',
          dividerId,
          newPosition,
          minSize,
          sizeContext: nextSizeContext,
        },
        input,
      );
    },
    [dispatchResize, getSizeContext, minSize],
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
          type: 'RESIZE_JUNCTION',
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

  const renderHeaderAdapter = useCallback(
    (tab: TileryTabHandle, ctx: { isActive: boolean }) =>
      renderTabHeader(tab as TileryTabHandle<TData>, ctx),
    [renderTabHeader],
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

  const tabPortals = useMemo(() => {
    return Object.values(state.tabs).map((tabState) => {
      const host = ensureTabHost(tabState.id);
      /* v8 ignore next */
      if (!host) return null;
      const isActive = activeByPanel[tabState.panelId] === tabState.id;
      const tabHandle = getCachedTabHandle(tabState.id);
      /* v8 ignore next */
      if (!tabHandle) return null;
      return createPortal(
        <div className="tilery__tab-content" data-active={isActive}>
          {renderTabContent(tabHandle as TileryTabHandle<TData>)}
        </div>,
        host,
        tabState.id,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tabs, activeByPanel, renderTabContent, getCachedTabHandle]);

  return (
    <div className="tilery">
      <div ref={containerRef} className="tilery__inner">
        {tileryAllPanelOrderFromState(state).map((panelId) => {
          if (fullScreenPanelId && panelId !== fullScreenPanelId) return null;
          const panel = getCachedPanelHandle(panelId);
          /* v8 ignore next */
          if (!panel) return null;
          const popoutRoot = panel.poppedOut ? popoutRoots[panelId] : null;
          const panelChrome = (
            <PanelChrome
              key={panelId}
              panel={panel}
              tilery={tileryRef.current!}
              renderHeader={renderHeaderAdapter}
              registerPanel={getRegisterPanel(panelId)}
              registerContentSlot={getRegisterContentSlot(panelId)}
              popoutWindow={Boolean(popoutRoot)}
              registerTabBar={getRegisterTabBar(panelId)}
              registerTab={stableRegisterTab}
              onPanelPointerDown={onPanelPointerDown}
              onFloatingResizePointerDown={onFloatingResizePointerDown}
              onTabPointerDown={drag.onTabPointerDown}
              onTabPointerMove={onPointerMove}
              onTabPointerUp={drag.onTabPointerUp}
              onTabPointerCancel={onPointerCancel}
              onTabBarPointerDown={drag.onTabBarPointerDown}
              onFloatingTabBarPointerDown={onFloatingTabBarPointerDown}
              onTabBarPointerUp={onTabBarPointerUp}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              showActionsButton={resolvePanelVisibility(
                showActionsButton,
                panel,
              )}
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
        })}

        {dividers.map((d) => (
          <TileryDivider
            key={d.id}
            divider={d}
            accessibility={dividerAccessibility[d.id]!}
            disabled={!resizable || d.disabled}
            hitSize={resizeHandleHitSize}
            onDrag={onDividerDrag}
            onDragEnd={commitResize}
            containerRef={containerRef}
          />
        ))}

        {junctions.map((junction) => (
          <TileryJunction
            key={junction.id}
            junction={junction}
            disabled={!resizable || junction.disabled}
            hitSize={resizeHandleHitSize}
            onDrag={onJunctionDrag}
            onDragEnd={commitResize}
            containerRef={containerRef}
          />
        ))}

        {tabPortals}

        {drag.dragState &&
          (() => {
            const draggedTab = getCachedTabHandle(drag.dragState.tabId);
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
                containerRef={containerRef}
                panelEls={panelEls.current}
                ghostLabel={ghostLabel}
              />
            );
          })()}
      </div>
    </div>
  );
}) as <TData = unknown>(
  props: TileryProps<TData> & { ref?: React.Ref<TileryHandle> },
) => React.ReactElement;

function resolvePanelVisibility(
  value: TileryPanelVisibility,
  panel: TileryPanelHandle,
): boolean {
  return typeof value === 'function' ? value(panel) : value;
}

function resizeFloatingBounds(
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

function defaultPopoutWindowBounds(win: Window): TileryPopoutWindowBounds {
  const width = 720;
  const height = 520;
  const screenLeft = finiteNumber(win.screenX, 0);
  const screenTop = finiteNumber(win.screenY, 0);
  const outerWidth = finiteNumber(win.outerWidth, width + 120);
  const outerHeight = finiteNumber(win.outerHeight, height + 120);
  return {
    left: Math.round(screenLeft + Math.max(24, (outerWidth - width) / 2)),
    top: Math.round(screenTop + Math.max(24, (outerHeight - height) / 2)),
    width,
    height,
  };
}

function normalizePopoutWindowBounds(
  value: Partial<TileryPopoutWindowBounds> | undefined,
  fallback: TileryPopoutWindowBounds,
): TileryPopoutWindowBounds {
  return {
    left: Math.round(finiteNumber(value?.left, fallback.left)),
    top: Math.round(finiteNumber(value?.top, fallback.top)),
    width: Math.round(
      Math.max(240, finiteNumber(value?.width, fallback.width)),
    ),
    height: Math.round(
      Math.max(160, finiteNumber(value?.height, fallback.height)),
    ),
  };
}

function readPopoutWindowBounds(win: Window): TileryPopoutWindowBounds {
  return normalizePopoutWindowBounds(
    {
      left: win.screenX,
      top: win.screenY,
      width: win.outerWidth,
      height: win.outerHeight,
    },
    defaultPopoutWindowBounds(win),
  );
}

function popoutFeatureString(bounds: TileryPopoutWindowBounds): string {
  return [
    'popup=yes',
    `left=${bounds.left}`,
    `top=${bounds.top}`,
    `width=${bounds.width}`,
    `height=${bounds.height}`,
  ].join(',');
}

function preparePopoutDocument(
  win: Window,
  sourceContainer: HTMLElement | null,
  panelId: TileryPanelId,
): HTMLElement | null {
  const sourceDocument = sourceContainer?.ownerDocument;
  const doc = win.document;
  if (!doc || !sourceDocument) return null;

  doc.head.innerHTML = '';
  doc.body.innerHTML = '';
  doc.title = `Tilery - ${panelId}`;
  doc.body.style.margin = '0';
  doc.body.style.overflow = 'hidden';
  doc.documentElement.style.height = '100%';
  doc.body.style.height = '100%';
  copyPopoutStyles(sourceDocument, doc);

  const root = doc.createElement('div');
  root.className = 'tilery tilery__popout';
  root.setAttribute('data-tilery-popout-root', panelId);
  doc.body.appendChild(root);
  return root;
}

function copyPopoutStyles(sourceDocument: Document, targetDocument: Document) {
  const base = targetDocument.createElement('base');
  base.href = sourceDocument.baseURI;
  targetDocument.head.appendChild(base);

  for (const node of Array.from(sourceDocument.head.children)) {
    const tagName = node.tagName.toLowerCase();
    const isStylesheetLink =
      tagName === 'link' &&
      (node as HTMLLinkElement).rel.toLowerCase() === 'stylesheet';
    if (tagName === 'style' || isStylesheetLink) {
      targetDocument.head.appendChild(node.cloneNode(true));
    }
  }
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeLifecycleEvents<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryLifecycleEvents<TData> {
  const source = action.type;
  const lifecycleSource = source as TileryLifecycleSource;
  const activeTabChanges = makeActiveTabChanges(previousState, state);
  const movedTabs = makeTabMoveChanges<TData>(previousState, state, action);
  const openedPanels = tileryAllPanelOrderFromState(state)
    .filter((panelId) => !previousState.panels[panelId])
    .map((panelId) => makePanelLifecycleChange(state.panels[panelId]!));
  const openedPanelTabs = openedPanels.flatMap((panel) =>
    panel.tabIds.map((tabId) =>
      makeTabLifecycleChange<TData>(state.tabs[tabId]!),
    ),
  );
  const panelSplit = makePanelSplitEvent<TData>(previousState, state, action);
  const openedTabs = Object.values(state.tabs)
    .filter((tab) => !previousState.tabs[tab.id])
    .map(makeTabLifecycleChange<TData>);
  const closedTabs = Object.values(previousState.tabs)
    .filter((tab) => !state.tabs[tab.id])
    .map(makeTabLifecycleChange<TData>);
  const closedPanels = tileryAllPanelOrderFromState(previousState)
    .filter((panelId) => !state.panels[panelId])
    .map((panelId) => makePanelLifecycleChange(previousState.panels[panelId]!));
  const panelTabs = closedPanels.flatMap((panel) =>
    panel.tabIds.map((tabId) =>
      makeTabLifecycleChange<TData>(previousState.tabs[tabId]!),
    ),
  );

  return {
    activeTabChange:
      activeTabChanges.length === 0
        ? null
        : {
            source: lifecycleSource,
            changes: activeTabChanges,
            previousState,
            state,
          },
    tabsMove:
      movedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: movedTabs,
            previousState,
            state,
          },
    panelsOpen:
      openedPanels.length === 0
        ? null
        : {
            source: lifecycleSource,
            panels: openedPanels,
            tabs: openedPanelTabs,
            previousState,
            state,
          },
    panelSplit,
    tabsOpen:
      openedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: openedTabs,
            previousState,
            state,
          },
    tabsClose:
      closedTabs.length === 0
        ? null
        : {
            source: lifecycleSource,
            tabs: closedTabs,
            panels: closedPanels,
            previousState,
            state,
          },
    panelsClose:
      closedPanels.length === 0
        ? null
        : {
            source: lifecycleSource,
            panels: closedPanels,
            tabs: panelTabs,
            previousState,
            state,
          },
  };
}

function makeActiveTabChanges(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
): TileryActiveTabChange[] {
  const changes: TileryActiveTabChange[] = [];
  for (const panelId of tileryAllPanelOrderFromState(state)) {
    const previousPanel = previousState.panels[panelId];
    const panel = state.panels[panelId];
    if (!previousPanel || !panel) continue;
    if (previousPanel.activeTabId === panel.activeTabId) continue;
    changes.push({
      panelId,
      previousTabId: previousPanel.activeTabId,
      tabId: panel.activeTabId,
    });
  }
  return changes;
}

function makeTabMoveChanges<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryTabMoveChange<TData>[] {
  const tabId =
    action.type === 'MOVE_TAB' ||
    action.type === 'FLOAT_TAB' ||
    action.type === 'POPOUT_TAB'
      ? action.tabId
      : null;
  if (!tabId) return [];
  const previousTab = previousState.tabs[tabId];
  const tab = state.tabs[tabId];
  if (!previousTab || !tab) return [];
  const previousPanel = previousState.panels[previousTab.panelId]!;
  const panel = state.panels[tab.panelId]!;
  const previousIndex = previousPanel.tabs.indexOf(tabId);
  const index = panel.tabs.indexOf(tabId);
  if (previousTab.panelId === tab.panelId && previousIndex === index) return [];
  return [
    {
      id: tab.id,
      previousPanelId: previousTab.panelId,
      panelId: tab.panelId,
      previousIndex,
      index,
      data: tab.data as TData,
      closeable: tab.closeable,
      draggable: tab.draggable,
    },
  ];
}

function makePanelSplitEvent<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  action: TileryReducerAction,
): TileryPanelSplitEvent<TData> | null {
  if (action.type === 'SPLIT_PANEL') {
    return makePanelSplitEventFromParts(
      previousState,
      state,
      'SPLIT_PANEL',
      action.panelId,
      action.newPanelId,
      action.direction,
      action.sizePercent,
    );
  }
  if (action.type === 'MOVE_TAB' && 'splitPanelId' in action.to) {
    return makePanelSplitEventFromParts(
      previousState,
      state,
      'MOVE_TAB',
      action.to.splitPanelId,
      action.to.newPanelId,
      action.to.direction,
      action.to.sizePercent,
    );
  }
  return null;
}

function makePanelSplitEventFromParts<TData>(
  previousState: TileryLayoutState,
  state: TileryLayoutState,
  source: TileryPanelSplitEvent['source'],
  splitPanelId: TileryPanelId,
  createdPanelId: TileryPanelId,
  direction: TileryDirection,
  size: number,
): TileryPanelSplitEvent<TData> | null {
  const splitPanel = state.panels[splitPanelId];
  const createdPanel = state.panels[createdPanelId];
  if (!previousState.panels[splitPanelId] || !splitPanel || !createdPanel) {
    return null;
  }
  return {
    source,
    splitPanelId,
    createdPanelId,
    direction,
    size,
    splitPanel: makePanelLifecycleChange(splitPanel),
    createdPanel: makePanelLifecycleChange(createdPanel),
    tabs: createdPanel.tabs.map((tabId) =>
      makeTabLifecycleChange<TData>(state.tabs[tabId]!),
    ),
    previousState,
    state,
  };
}

function makeTabLifecycleChange<TData>(
  tab: NonNullable<TileryLayoutState['tabs'][string]>,
): TileryTabLifecycleChange<TData> {
  return {
    id: tab.id,
    panelId: tab.panelId,
    data: tab.data as TData,
    closeable: tab.closeable,
    draggable: tab.draggable,
  };
}

function makePanelLifecycleChange(
  panel: NonNullable<TileryLayoutState['panels'][string]>,
): TileryPanelLifecycleChange {
  return {
    id: panel.id,
    tabIds: [...panel.tabs],
    activeTabId: panel.activeTabId,
  };
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
  if (action.type === 'RESIZE_DIVIDER') {
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
