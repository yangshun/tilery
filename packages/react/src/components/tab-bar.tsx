'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import type {
  TileryHandle,
  TileryPanelHandle,
  TileryTabHandle,
} from 'tilery/internal';
import { tileryPanelBehaviorFromState } from 'tilery/internal';
import { PanelActions, type PanelActionsProps } from './panel-actions';
import { Tab } from './tab';

export type TabBarProps = {
  panel: TileryPanelHandle;
  tilery: TileryHandle;
  renderHeader: (
    tab: TileryTabHandle,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  registerTabBar: (el: HTMLElement | null) => void;
  registerTab: (tabId: string, el: HTMLElement | null) => void;
  onTabPointerDown: (e: React.PointerEvent, tabId: string) => void;
  onTabPointerMove: (e: React.PointerEvent) => void;
  onTabPointerUp: (
    e: React.PointerEvent,
    tabId: string,
    onClick: () => void,
  ) => void;
  onTabPointerCancel: (e: React.PointerEvent) => void;
  onTabBarPointerDown: (e: React.PointerEvent, panelId: string) => void;
  onFloatingTabBarPointerDown?: (
    e: React.PointerEvent,
    panelId: string,
  ) => void;
  onTabBarPointerUp: (e: React.PointerEvent) => void;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
} & Pick<
  PanelActionsProps,
  | 'showActionsButton'
  | 'showNewTabButton'
  | 'onNewTab'
  | 'renderPanelActions'
  | 'renderActionsButtonIcon'
>;

function TabRow({
  tab,
  isActive,
  renderHeader,
  registerTab,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
  onTabClick,
  onTabClose,
}: {
  tab: TileryTabHandle;
  isActive: boolean;
} & Pick<
  TabBarProps,
  | 'renderHeader'
  | 'registerTab'
  | 'onTabPointerDown'
  | 'onTabPointerMove'
  | 'onTabPointerUp'
  | 'onTabPointerCancel'
  | 'onTabClick'
  | 'onTabClose'
>) {
  const tabId = tab.id;
  const handleDown = useCallback(
    (e: React.PointerEvent) => onTabPointerDown(e, tabId),
    [onTabPointerDown, tabId],
  );
  const handleUp = useCallback(
    (e: React.PointerEvent) =>
      onTabPointerUp(e, tabId, () => onTabClick(tabId)),
    [onTabPointerUp, onTabClick, tabId],
  );
  const handleClose = useCallback(() => onTabClose(tabId), [onTabClose, tabId]);
  return (
    <Tab
      tab={tab}
      isActive={isActive}
      renderHeader={renderHeader}
      registerTab={registerTab}
      onPointerDown={handleDown}
      onPointerMove={onTabPointerMove}
      onPointerUp={handleUp}
      onPointerCancel={onTabPointerCancel}
      onClose={handleClose}
    />
  );
}

export function TabBar({
  panel,
  tilery,
  renderHeader,
  registerTabBar,
  registerTab,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
  onTabBarPointerDown,
  onFloatingTabBarPointerDown,
  onTabBarPointerUp,
  onTabClick,
  onTabClose,
  showActionsButton,
  showNewTabButton,
  onNewTab,
  renderPanelActions,
  renderActionsButtonIcon,
}: TabBarProps) {
  const panelId = panel.id;
  const activeTabId = panel.activeTab?.id ?? null;
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const behavior = tileryPanelBehaviorFromState(tilery.getState(), panelId);
  const canDragPanel =
    behavior.draggable &&
    panel.tabs.length > 0 &&
    panel.tabs.every((tab) => tab.draggable);
  /* v8 ignore next */
  const handleBarDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        panel.floating &&
        !panel.poppedOut &&
        !target.closest('[data-tab-id]') &&
        !target.closest('[data-tilery-panel-actions]')
      ) {
        onFloatingTabBarPointerDown?.(e, panelId);
        return;
      }
      onTabBarPointerDown(e, panelId);
    },
    [
      onFloatingTabBarPointerDown,
      onTabBarPointerDown,
      panel.floating,
      panel.poppedOut,
      panelId,
    ],
  );
  const handleTabListRef = useCallback(
    (el: HTMLDivElement | null) => {
      tabListRef.current = el;
      registerTabBar(el);
    },
    [registerTabBar],
  );
  const handleTabListWheel = useCallback((e: React.WheelEvent) => {
    const tabList = tabListRef.current;
    /* v8 ignore next -- the handler is detached before this is reachable. */
    if (!tabList) return;
    const maxScrollLeft = tabList.scrollWidth - tabList.clientWidth;
    if (maxScrollLeft <= 0) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const next = Math.max(
      0,
      Math.min(maxScrollLeft, tabList.scrollLeft + delta),
    );
    if (next === tabList.scrollLeft) return;

    e.preventDefault();
    tabList.scrollLeft = next;
  }, []);

  useLayoutEffect(() => {
    const tabList = tabListRef.current;
    /* v8 ignore next -- React always calls the ref before this effect runs. */
    if (!tabList) return;
    /* v8 ignore next -- empty panels render no active tab to reveal. */
    if (!activeTabId) return;
    const activeTab = tabList.querySelector<HTMLElement>(
      `[data-tab-id="${cssEscape(activeTabId)}"]`,
    );
    /* v8 ignore next -- panel handles only expose active tabs present in the row. */
    if (!activeTab) return;
    scrollTabIntoView(tabList, activeTab);
  }, [activeTabId, panel.tabs]);

  return (
    <div
      className="tilery__tab-bar"
      data-panel-id={panel.id}
      data-draggable={canDragPanel}
      data-droppable={behavior.droppable}
      onPointerDown={handleBarDown}
      onPointerMove={onTabPointerMove}
      onPointerUp={onTabBarPointerUp}
      onPointerCancel={onTabPointerCancel}>
      <div
        ref={handleTabListRef}
        className="tilery__tab-list"
        role="tablist"
        onWheel={handleTabListWheel}>
        {panel.tabs.map((tab) => (
          <TabRow
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            renderHeader={renderHeader}
            registerTab={registerTab}
            onTabPointerDown={onTabPointerDown}
            onTabPointerMove={onTabPointerMove}
            onTabPointerUp={onTabPointerUp}
            onTabPointerCancel={onTabPointerCancel}
            onTabClick={onTabClick}
            onTabClose={onTabClose}
          />
        ))}
      </div>
      <PanelActions
        panel={panel}
        tilery={tilery}
        showActionsButton={showActionsButton}
        showNewTabButton={showNewTabButton}
        onNewTab={onNewTab}
        renderPanelActions={renderPanelActions}
        renderActionsButtonIcon={renderActionsButtonIcon}
      />
    </div>
  );
}

function scrollTabIntoView(tabList: HTMLElement, tab: HTMLElement) {
  const listRect = tabList.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();

  if (tabRect.left < listRect.left) {
    tabList.scrollLeft -= listRect.left - tabRect.left;
  } else if (tabRect.right > listRect.right) {
    tabList.scrollLeft += tabRect.right - listRect.right;
  }
}

function cssEscape(value: string): string {
  /* v8 ignore next 3 */
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
