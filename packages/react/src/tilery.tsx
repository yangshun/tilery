'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { PanelChrome } from './components/panel-chrome';
import { TileryDivider, type DividerAccessibility } from './components/divider';
import { TileryJunction } from './components/junction';
import { DropOverlay } from './components/drop-overlay';
import { tileryPanelDomId } from './dom-ids';
import { useTileryDragController } from './use-drag-controller';
import {
  tileryCreateInitialState,
  tileryReducer,
  makeTileryHandle,
  tileryClampDividerPosition,
  tileryDeriveDividers,
  tileryDeriveJunctions,
  tileryGetFullScreenPanelId,
  type TileryReducerAction,
  type TileryInitialLayout,
  type TileryDivider as TileryDividerState,
  type TileryLayoutState,
  type TileryLayoutTree,
  type TileryHandle,
  type TileryPanelHandle,
  type TileryPanelId,
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

export type TileryProps<TData = unknown> = {
  initialLayout: TileryInitialLayout<TData>;
  renderTabHeader: (
    tab: TileryTabHandle<TData>,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  renderTabContent: (tab: TileryTabHandle<TData>) => React.ReactNode;
  onChange?: (state: TileryLayoutState) => void;
  minSize?: number;
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
    minSize = 10,
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

  const containerRef = useRef<HTMLDivElement | null>(null);

  const dispatchWithMin = useCallback(
    (action: TileryReducerAction) => {
      if (
        action.type === 'RESIZE_DIVIDER' ||
        action.type === 'RESIZE_JUNCTION'
      ) {
        dispatch({
          ...action,
          /* v8 ignore next */
          minSize: action.minSize ?? minSize,
        });
      } else {
        dispatch(action);
      }
    },
    [minSize],
  );

  const getState = useCallback(() => stateRef.current, []);

  const tileryRef = useRef<TileryHandle | null>(null);
  if (!tileryRef.current) {
    tileryRef.current = makeTileryHandle(getState, dispatchWithMin);
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

  const drag = useTileryDragController(() => tileryRef.current);

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
    () => makeDividerAccessibilityMap(state, dividers, minSize),
    [dividers, minSize, state],
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
    for (const pid of tileryPanelOrderFromState(state)) {
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
  const onDividerDrag = useCallback(
    (dividerId: string, newPosition: number) => {
      dispatchWithMin({
        type: 'RESIZE_DIVIDER',
        dividerId,
        newPosition,
        minSize,
      });
    },
    [dispatchWithMin, minSize],
  );
  const onJunctionDrag = useCallback(
    (junctionId: string, x: number, y: number) => {
      dispatchWithMin({
        type: 'RESIZE_JUNCTION',
        junctionId,
        x,
        y,
        minSize,
      });
    },
    [dispatchWithMin, minSize],
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
        {tileryPanelOrderFromState(state).map((panelId) => {
          if (fullScreenPanelId && panelId !== fullScreenPanelId) return null;
          const panel = getCachedPanelHandle(panelId);
          /* v8 ignore next */
          if (!panel) return null;
          return (
            <PanelChrome
              key={panelId}
              panel={panel}
              tilery={tileryRef.current!}
              renderHeader={renderHeaderAdapter}
              registerPanel={getRegisterPanel(panelId)}
              registerContentSlot={getRegisterContentSlot(panelId)}
              registerTabBar={getRegisterTabBar(panelId)}
              registerTab={stableRegisterTab}
              onTabPointerDown={drag.onTabPointerDown}
              onTabPointerMove={drag.onTabPointerMove}
              onTabPointerUp={drag.onTabPointerUp}
              onTabPointerCancel={drag.onTabPointerCancel}
              onTabBarPointerDown={drag.onTabBarPointerDown}
              onTabBarPointerUp={drag.onTabBarPointerUp}
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
        })}

        {dividers.map((d) => (
          <TileryDivider
            key={d.id}
            divider={d}
            accessibility={dividerAccessibility[d.id]!}
            onDrag={onDividerDrag}
            containerRef={containerRef}
          />
        ))}

        {junctions.map((junction) => (
          <TileryJunction
            key={junction.id}
            junction={junction}
            onDrag={onJunctionDrag}
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

function tileryPanelOrderFromState(state: TileryLayoutState): TileryPanelId[] {
  const order = state.layout
    ? tileryPanelOrderFromLayout(state.layout)
    : /* v8 ignore next -- React initial layouts always create a tree. */
      state.panelOrder;
  return order.filter((id) => Boolean(state.panels[id]));
}

function tileryPanelOrderFromLayout(layout: TileryLayoutTree): TileryPanelId[] {
  if (layout.kind === 'panel') return [layout.panelId];
  return layout.children.flatMap((child) => tileryPanelOrderFromLayout(child));
}

function makeDividerAccessibilityMap(
  state: TileryLayoutState,
  dividers: TileryDividerState[],
  minSize: number,
): Record<string, DividerAccessibility> {
  const result: Record<string, DividerAccessibility> = {};
  for (const divider of dividers) {
    result[divider.id] = makeDividerAccessibility(state, divider, minSize);
  }
  return result;
}

function makeDividerAccessibility(
  state: TileryLayoutState,
  divider: TileryDividerState,
  minSize: number,
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
  const minPosition = tileryClampDividerPosition(state, divider, 0, minSize);
  const maxPosition = tileryClampDividerPosition(state, divider, 100, minSize);
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
