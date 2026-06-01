'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';
import { TabContent } from '../example-ui';

type TabData = { title: string };

const layout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'tab-a', data: { title: 'Panel A' } }],
    },
    {
      type: 'panel',
      id: 'right',
      size: 50,
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
        <TabContent>
          <p style={{ margin: 0 }}>
            Content for {tab.data.title}. Drag the divider to resize.
          </p>
        </TabContent>
      )}
    />
  );
}
