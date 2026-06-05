'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, TabContent } from '../example-ui';

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
    <ExampleSection
      title="Basic horizontal split"
      description="Two equal panels share the workspace and resize from the divider between them.">
      <Tilery<TabData>
        initialLayout={layout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent>
            <p style={{ margin: 0 }}>
              Content for {tab.data.title}. Drag the divider to resize.
            </p>
          </TabContent>
        )}
      />
    </ExampleSection>
  );
}
