'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = { title: string };

const layout: TileryInitialLayout<TabData> = {
  panels: [
    {
      id: 'left',
      inset: { top: 0, right: 50, bottom: 0, left: 0 },
      tabs: [{ id: 'tab-a', data: { title: 'Panel A' } }],
    },
    {
      id: 'right',
      inset: { top: 0, right: 0, bottom: 0, left: 50 },
      tabs: [{ id: 'tab-b', data: { title: 'Panel B' } }],
    },
  ],
};

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab: TileryTabHandle<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => (
        <div style={{ padding: 16, color: '#9aa1ab', fontSize: 13 }}>
          Content for {tab.data.title}. Drag the divider to resize.
        </div>
      )}
    />
  );
}
