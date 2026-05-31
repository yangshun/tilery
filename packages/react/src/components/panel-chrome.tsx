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
  tilery,
  renderHeader,
  registerPanel,
  registerContentSlot,
  ...tabBarProps
}: PanelChromeProps) {
  const { top, right, bottom, left } = panel.inset;
  const isFullScreen = panel.fullScreen;
  return (
    <div
      ref={registerPanel}
      className="tilery__panel"
      data-panel-id={panel.id}
      data-full-screen={isFullScreen}
      style={{
        top: isFullScreen ? '0%' : `${top}%`,
        right: isFullScreen ? '0%' : `${right}%`,
        bottom: isFullScreen ? '0%' : `${bottom}%`,
        left: isFullScreen ? '0%' : `${left}%`,
      }}>
      <TabBar
        panel={panel}
        tilery={tilery}
        renderHeader={renderHeader}
        {...tabBarProps}
      />
      <div ref={registerContentSlot} className="tilery__panel-content" />
    </div>
  );
}
