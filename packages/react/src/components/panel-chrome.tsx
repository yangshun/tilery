'use client';

import type { TileryPanelHandle, TileryTabHandle } from 'tilery/internal';
import { TabBar, type TabBarProps } from './tab-bar';

export type PanelChromeProps = Omit<TabBarProps, 'panel' | 'renderHeader'> & {
  panel: TileryPanelHandle;
  renderHeader: (
    tab: TileryTabHandle,
    ctx: { isActive: boolean },
  ) => React.ReactNode;
  registerPanel: (el: HTMLElement | null) => void;
  registerContentSlot: (el: HTMLElement | null) => void;
};

export function PanelChrome({
  panel,
  renderHeader,
  registerPanel,
  registerContentSlot,
  ...tabBarProps
}: PanelChromeProps) {
  const { top, right, bottom, left } = panel.inset;
  const isCollapsed = panel.collapsed;
  const isFullScreen = panel.fullScreen;
  return (
    <div
      ref={registerPanel}
      className="tilery__panel"
      data-panel-id={panel.id}
      data-collapsed={isCollapsed}
      data-full-screen={isFullScreen}
      aria-expanded={!isCollapsed}
      style={{
        top: isFullScreen ? '0%' : `${top}%`,
        right: isFullScreen ? '0%' : `${right}%`,
        bottom: isFullScreen ? '0%' : `${bottom}%`,
        left: isFullScreen ? '0%' : `${left}%`,
      }}>
      {isCollapsed && panel.collapsedTitle ? (
        <button
          type="button"
          className="tilery__collapsed-title"
          onClick={() => panel.expand()}>
          {panel.collapsedTitle}
        </button>
      ) : (
        <TabBar panel={panel} renderHeader={renderHeader} {...tabBarProps} />
      )}
      <div
        ref={registerContentSlot}
        className="tilery__panel-content"
        hidden={isCollapsed}
      />
    </div>
  );
}
