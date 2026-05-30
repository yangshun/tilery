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
  return (
    <div
      ref={registerPanel}
      className="tilery__panel"
      data-panel-id={panel.id}
      style={{
        top: `${top}%`,
        right: `${right}%`,
        bottom: `${bottom}%`,
        left: `${left}%`,
      }}>
      <TabBar panel={panel} renderHeader={renderHeader} {...tabBarProps} />
      <div ref={registerContentSlot} className="tilery__panel-content" />
    </div>
  );
}
