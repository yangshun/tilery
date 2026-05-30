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
import { Divider } from './components/divider';
import { JunctionHandle } from './components/junction-handle';
import { DropOverlay } from './components/drop-overlay';
import { useDragController } from './use-drag-controller';
import {
  createInitialState,
  reducer,
  makeTileryHandle,
  deriveDividers,
  deriveJunctions,
  type ReducerAction,
  type Junction,
  type InitialLayout,
  type LayoutState,
  type TileryHandle,
  type PanelHandle,
  type PanelId,
  type TabHandle,
  type TabId,
} from '@tilery/core';

import '@tilery/core/style.css';

export type TileryProps<TData = unknown> = {
  initialLayout: InitialLayout<TData>;
  renderTabHeader: (
    tab: TabHandle<TData>,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  renderTabContent: (tab: TabHandle<TData>) => React.ReactNode;
  onChange?: (state: LayoutState) => void;
  minPanelSizePercent?: number;
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
    minPanelSizePercent = 10,
  } = props;

  const [state, dispatch] = useReducer(
    reducer,
    initialLayout,
    createInitialState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const dispatchWithMin = useCallback(
    (action: ReducerAction) => {
      if (action.type === 'RESIZE_DIVIDER') {
        dispatch({
          ...action,
          /* v8 ignore next */
          minSizePercent: action.minSizePercent ?? minPanelSizePercent,
        });
      } else {
        dispatch(action);
      }
    },
    [minPanelSizePercent],
  );

  const getState = useCallback(() => stateRef.current, []);

  const tileryRef = useRef<TileryHandle | null>(null);
  if (!tileryRef.current) {
    tileryRef.current = makeTileryHandle(getState, dispatchWithMin);
  }
  useImperativeHandle(ref, () => tileryRef.current!, []);

  const panelHandleCache = useRef<Map<PanelId, PanelHandle>>(new Map());
  const getCachedPanelHandle = useCallback(
    (id: PanelId): PanelHandle | null => {
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
  const tabHandleCache = useRef<Map<TabId, TabHandle>>(new Map());
  const getCachedTabHandle = useCallback((id: TabId): TabHandle | null => {
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
  }, []);

  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  const drag = useDragController(() => tileryRef.current);

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
    Record<PanelId, HTMLElement | null>
  >({});
  const slotCbCache = useRef<Map<PanelId, (el: HTMLElement | null) => void>>(
    new Map(),
  );
  const getRegisterContentSlot = useCallback((panelId: PanelId) => {
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

  const tabHosts = useRef<Map<TabId, HTMLDivElement>>(new Map());
  const ensureTabHost = (tabId: TabId): HTMLDivElement | null => {
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

  const dividers = useMemo(() => deriveDividers(state), [state]);
  const junctions = useMemo(() => deriveJunctions(dividers), [dividers]);

  const activeByPanelRef = useRef<Record<PanelId, TabId | null>>({});
  const activeByPanelFp = useRef<string>('');
  const activeByPanel = useMemo(() => {
    let fp = '';
    const next: Record<PanelId, TabId | null> = {};
    for (const pid of state.panelOrder) {
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
  }, [state.panelOrder, state.panels]);

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
        minSizePercent: minPanelSizePercent,
      });
    },
    [dispatchWithMin, minPanelSizePercent],
  );

  const onJunctionDrag = useCallback(
    (junction: Junction, xPct: number, yPct: number) => {
      dispatchWithMin({
        type: 'RESIZE_DIVIDER',
        dividerId: junction.verticalDividerId,
        newPosition: xPct,
        minSizePercent: minPanelSizePercent,
      });
      dispatchWithMin({
        type: 'RESIZE_DIVIDER',
        dividerId: junction.horizontalDividerId,
        newPosition: yPct,
        minSizePercent: minPanelSizePercent,
      });
    },
    [dispatchWithMin, minPanelSizePercent],
  );

  const renderHeaderAdapter = useCallback(
    (tab: TabHandle, ctx: { isActive: boolean }) =>
      renderTabHeader(tab as TabHandle<TData>, ctx),
    [renderTabHeader],
  );

  const panelEls = useRef<Map<PanelId, HTMLElement>>(new Map());
  const panelCbCache = useRef<Map<PanelId, (el: HTMLElement | null) => void>>(
    new Map(),
  );
  const tabBarCbCache = useRef<Map<PanelId, (el: HTMLElement | null) => void>>(
    new Map(),
  );
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
    (panelId: PanelId) => {
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
    (panelId: PanelId) => {
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
          {renderTabContent(tabHandle as TabHandle<TData>)}
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
        {state.panelOrder.map((panelId) => {
          const panel = getCachedPanelHandle(panelId);
          /* v8 ignore next */
          if (!panel) return null;
          return (
            <PanelChrome
              key={panelId}
              panel={panel}
              renderHeader={renderHeaderAdapter}
              registerPanel={getRegisterPanel(panelId)}
              registerContentSlot={getRegisterContentSlot(panelId)}
              registerTabBar={getRegisterTabBar(panelId)}
              registerTab={stableRegisterTab}
              onTabPointerDown={drag.onTabPointerDown}
              onTabPointerMove={drag.onTabPointerMove}
              onTabPointerUp={drag.onTabPointerUp}
              onTabPointerCancel={drag.onTabPointerCancel}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
            />
          );
        })}

        {dividers.map((d) => (
          <Divider
            key={d.id}
            divider={d}
            onDrag={onDividerDrag}
            containerRef={containerRef}
          />
        ))}

        {junctions.map((j) => (
          <JunctionHandle
            key={j.id}
            junction={j}
            onDrag={onJunctionDrag}
            containerRef={containerRef}
          />
        ))}

        {tabPortals}

        {drag.dragState &&
          (() => {
            const draggedTab = getCachedTabHandle(drag.dragState.tabId);
            const ghostLabel = draggedTab
              ? renderHeaderAdapter(draggedTab, { isActive: false })
              : 'Tab';
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
