'use client';

/**
 * The tab strip for a panel.
 */

import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { TileryController, TileryPanel, TileryTab } from 'tilery/internal';
import { tileryPanelBehaviorFromState } from 'tilery/internal';
import { PanelActions, type PanelActionsProps } from './panel-actions';
import { Tab } from './tab';
import type { TileryTabTriggerRenderer } from '../tilery';
import { tileryCssEscape as cssEscape } from '../css-escape';

/**
 * Props for the {@link TabBar} component.
 */
export type TabBarProps = {
  /** The panel model whose tabs are rendered in this strip. */
  panel: TileryPanel;
  /** The Tilery layout controller for the current root. */
  tilery: TileryController;
  /**
   * Renders the visible header content for a tab in the strip and in the
   * overflow menu.
   */
  renderHeader: (tab: TileryTab, ctx: { isActive: boolean }) => React.ReactNode;
  /**
   * Replaces the default `<div>` tab trigger with a custom element. The
   * renderer receives the tab model, active state, pre-built props, and
   * children.
   */
  renderTabTrigger?: TileryTabTriggerRenderer;
  /** Callback ref that registers the tab-list element. */
  registerTabBar: (el: HTMLElement | null) => void;
  /** Callback ref that registers an individual tab element by ID. */
  registerTab: (tabId: string, el: HTMLElement | null) => void;
  /** Called on pointer-down over a tab trigger. */
  onTabPointerDown: (e: React.PointerEvent, tabId: string) => void;
  /** Called on pointer-move during a tab drag gesture. */
  onTabPointerMove: (e: React.PointerEvent) => void;
  /**
   * Called on pointer-up over a tab trigger. The `onClick` callback should
   * be invoked if the gesture was a click rather than a drag.
   */
  onTabPointerUp: (
    e: React.PointerEvent,
    tabId: string,
    onClick: () => void,
  ) => void;
  /** Called on pointer-cancel to clean up an interrupted tab drag. */
  onTabPointerCancel: (e: React.PointerEvent) => void;
  /** Called on pointer-down over the bar background (outside any tab). */
  onTabBarPointerDown: (e: React.PointerEvent, panelId: string) => void;
  /**
   * Called on pointer-down over the floating panel's tab bar when the
   * pointer is not over a tab or action button, initiating a panel drag.
   */
  onFloatingTabBarPointerDown?: (
    e: React.PointerEvent,
    panelId: string,
  ) => void;
  /** Called on pointer-up over the bar background to end a drag. */
  onTabBarPointerUp: (e: React.PointerEvent) => void;
  /** Called when a tab is activated via click or overflow menu. */
  onTabClick: (tabId: string) => void;
  /** Called when the close button on a tab is clicked. */
  onTabClose: (tabId: string) => void;
} & Pick<
  PanelActionsProps,
  | 'showActionsButton'
  | 'showNewTabButton'
  | 'onNewTab'
  | 'renderPanelActions'
  | 'renderActionsButtonIcon'
>;

const TabRow = memo(function TabRow({
  tab,
  isActive,
  renderHeader,
  renderTabTrigger,
  registerTab,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
  onTabClick,
  onTabClose,
}: {
  tab: TileryTab;
  isActive: boolean;
} & Pick<
  TabBarProps,
  | 'renderHeader'
  | 'renderTabTrigger'
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
      renderTrigger={renderTabTrigger}
      registerTab={registerTab}
      onPointerDown={handleDown}
      onPointerMove={onTabPointerMove}
      onPointerUp={handleUp}
      onPointerCancel={onTabPointerCancel}
      onClose={handleClose}
    />
  );
});

function TabOverflowIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16">
      <path
        d="M4.5 6.25 8 9.75l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Renders the scrollable tab strip for a single panel. Tracks which tabs
 * overflow the visible area, exposes an overflow dropdown menu for hidden
 * tabs, auto-scrolls the active tab into view, and delegates to
 * {@link PanelActions} for the new-tab and actions buttons.
 */
export function TabBar({
  panel,
  tilery,
  renderHeader,
  renderTabTrigger,
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
  const tabIdsKey = panel.tabs.map((tab) => tab.id).join('\u001f');
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [hiddenTabIds, setHiddenTabIds] = useState<string[]>([]);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
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
        !target.closest('[data-tilery-tab-overflow]') &&
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
  const updateHiddenTabs = useCallback(() => {
    const tabList = tabListRef.current;
    /* v8 ignore next 4 -- callers only run after the tab-list ref is registered. */
    if (!tabList) {
      setHiddenTabIds((previous) => (previous.length === 0 ? previous : []));
      setIsOverflowMenuOpen(false);
      return;
    }

    const next = getHiddenTabIds(tabList, panel.tabs);
    setHiddenTabIds((previous) =>
      areStringArraysEqual(previous, next) ? previous : next,
    );
    if (next.length === 0) setIsOverflowMenuOpen(false);
  }, [tabIdsKey]);
  const handleTabListWheel = useCallback(
    (e: React.WheelEvent) => {
      const tabList = tabListRef.current;
      /* v8 ignore next -- the handler is detached before this is reachable. */
      if (!tabList) return;
      const maxScrollLeft = tabList.scrollWidth - tabList.clientWidth;
      if (maxScrollLeft <= 0) return;

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const next = Math.max(
        0,
        Math.min(maxScrollLeft, tabList.scrollLeft + delta),
      );
      if (next === tabList.scrollLeft) return;

      e.preventDefault();
      tabList.scrollLeft = next;
      updateHiddenTabs();
    },
    [updateHiddenTabs],
  );
  const handleTabListScroll = useCallback(() => {
    updateHiddenTabs();
  }, [updateHiddenTabs]);
  const handleTabListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const focused = (e.target as HTMLElement).closest<HTMLElement>(
          '[data-tab-id]',
        );
        const id = focused?.getAttribute('data-tab-id');
        if (!id) return;
        e.preventDefault();
        onTabClick(id);
        return;
      }
      const tabs = panel.tabs;
      /* v8 ignore next -- the tab-list only receives key events via a focused tab. */
      if (tabs.length === 0) return;
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      let nextIndex: number;
      if (e.key === 'ArrowRight') nextIndex = currentIndex + 1;
      else if (e.key === 'ArrowLeft') nextIndex = currentIndex - 1;
      else if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = tabs.length - 1;
      else return;
      if (nextIndex < 0) nextIndex = tabs.length - 1;
      else if (nextIndex >= tabs.length) nextIndex = 0;
      const nextTab = tabs[nextIndex]!;
      e.preventDefault();
      onTabClick(nextTab.id);
      const nextEl = tabListRef.current?.querySelector<HTMLElement>(
        `[role="tab"][data-tab-id="${cssEscape(nextTab.id)}"]`,
      );
      /* v8 ignore next -- the navigated-to tab is always present in the row. */
      nextEl?.focus();
    },
    [panel.tabs, activeTabId, onTabClick],
  );
  const closeOverflowMenu = useCallback(() => {
    setIsOverflowMenuOpen(false);
  }, []);
  const activateOverflowTab = useCallback(
    (tabId: string) => {
      const tabList = tabListRef.current;
      const tab = tabList?.querySelector<HTMLElement>(
        `[data-tab-id="${cssEscape(tabId)}"]`,
      );
      /* v8 ignore next 4 -- overflow menu items are rendered from existing tabs. */
      if (tabList && tab) {
        scrollTabIntoView(tabList, tab);
        updateHiddenTabs();
      }
      onTabClick(tabId);
      closeOverflowMenu();
    },
    [closeOverflowMenu, onTabClick, updateHiddenTabs],
  );

  useLayoutEffect(() => {
    const tabList = tabListRef.current;
    /* v8 ignore next -- React always calls the ref before this effect runs. */
    if (!tabList) return;
    /* v8 ignore next -- empty panels render no active tab to reveal. */
    if (!activeTabId) return;
    const activeTab = tabList.querySelector<HTMLElement>(
      `[data-tab-id="${cssEscape(activeTabId)}"]`,
    );
    /* v8 ignore next -- panel objects only expose active tabs present in the row. */
    if (!activeTab) return;
    scrollTabIntoView(tabList, activeTab);
    updateHiddenTabs();
  }, [activeTabId, tabIdsKey, updateHiddenTabs]);

  useLayoutEffect(() => {
    updateHiddenTabs();
  }, [updateHiddenTabs]);

  useLayoutEffect(() => {
    const tabList = tabListRef.current;
    /* v8 ignore next -- React always calls the ref before this effect runs. */
    if (!tabList) return;
    const win = tabList.ownerDocument.defaultView;
    win?.addEventListener('resize', updateHiddenTabs);
    return () => win?.removeEventListener('resize', updateHiddenTabs);
  }, [updateHiddenTabs]);

  const hiddenTabs = panel.tabs.filter((tab) => hiddenTabIds.includes(tab.id));
  const hasHiddenTabs = hiddenTabs.length > 0;

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
        data-overflowing={hasHiddenTabs}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleTabListKeyDown}
        onScroll={handleTabListScroll}
        onWheel={handleTabListWheel}>
        {panel.tabs.map((tab) => (
          <TabRow
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            renderHeader={renderHeader}
            renderTabTrigger={renderTabTrigger}
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
      {hasHiddenTabs && (
        <div
          className="tilery__tab-overflow"
          data-tilery-tab-overflow=""
          onPointerDown={(e) => {
            e.stopPropagation();
          }}>
          <button
            type="button"
            className="tilery__panel-action-button tilery__tab-overflow-button"
            aria-label="Show hidden tabs"
            aria-haspopup="menu"
            aria-expanded={isOverflowMenuOpen}
            onClick={() => setIsOverflowMenuOpen((open) => !open)}>
            <TabOverflowIcon />
          </button>
          {isOverflowMenuOpen && (
            <div
              className="tilery__panel-menu tilery__tab-overflow-menu"
              role="menu"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeOverflowMenu();
              }}>
              {hiddenTabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="tilery__panel-menu-item tilery__tab-overflow-menu-item"
                    data-active={isActive}
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => activateOverflowTab(tab.id)}>
                    {renderHeader(tab, { isActive })}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
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

function getHiddenTabIds(tabList: HTMLElement, tabs: readonly TileryTab[]) {
  if (tabList.scrollWidth <= tabList.clientWidth) return [];

  const listRect = tabList.getBoundingClientRect();
  const listLeft = listRect.left;
  const listRight = listRect.right;
  return tabs
    .filter((tab) => {
      const tabEl = tabList.querySelector<HTMLElement>(
        `[data-tab-id="${cssEscape(tab.id)}"]`,
      );
      /* v8 ignore next -- stale refs are only possible during unmount churn. */
      if (!tabEl) return false;
      const tabRect = tabEl.getBoundingClientRect();
      return tabRect.left < listLeft || tabRect.right > listRight;
    })
    .map((tab) => tab.id);
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

function areStringArraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
