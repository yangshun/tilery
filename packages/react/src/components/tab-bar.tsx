'use client';

import { useCallback } from 'react';
import type { TileryPanelHandle, TileryTabHandle } from 'tilery/internal';
import { Tab } from './tab';

export type TabBarProps = {
  panel: TileryPanelHandle;
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
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
};

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
  renderHeader,
  registerTabBar,
  registerTab,
  onTabPointerDown,
  onTabPointerMove,
  onTabPointerUp,
  onTabPointerCancel,
  onTabClick,
  onTabClose,
}: TabBarProps) {
  return (
    <div
      ref={registerTabBar}
      className="tilery__tab-bar"
      role="tablist"
      data-panel-id={panel.id}>
      {panel.tabs.map((tab) => (
        <TabRow
          key={tab.id}
          tab={tab}
          isActive={panel.activeTab?.id === tab.id}
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
  );
}
