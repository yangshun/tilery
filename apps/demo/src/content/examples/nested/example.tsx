'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, TabContent } from '../example-ui';

type TabData = { title: string; nested?: boolean };

const innerLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'inner-left',
      size: 50,
      tabs: [{ id: 'inner-a', data: { title: 'Inner A' } }],
    },
    {
      type: 'panel',
      id: 'inner-right',
      size: 50,
      tabs: [{ id: 'inner-b', data: { title: 'Inner B' } }],
    },
  ],
};

const outerLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'sidebar',
      size: 30,
      tabs: [{ id: 'nav', data: { title: 'Navigation' }, closable: false }],
    },
    {
      type: 'panel',
      id: 'main',
      size: 70,
      tabs: [
        { id: 'nested-tab', data: { title: 'Nested Tilery', nested: true } },
        { id: 'regular', data: { title: 'Regular Tab' } },
      ],
    },
  ],
};

function InnerTilery() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Tilery<TabData>
        initialLayout={innerLayout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent>
            <p style={{ margin: 0 }}>{tab.data.title} nested instance.</p>
          </TabContent>
        )}
      />
    </div>
  );
}

export function Example() {
  return (
    <ExampleSection
      title="Nested workspace roots"
      description="The outer workspace owns the shell while a tab hosts a separate Tilery instance.">
      <Tilery<TabData>
        initialLayout={outerLayout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => {
          if (tab.data.nested) return <InnerTilery />;
          return (
            <TabContent>
              <p style={{ margin: 0 }}>{tab.data.title} content.</p>
            </TabContent>
          );
        }}
      />
    </ExampleSection>
  );
}
