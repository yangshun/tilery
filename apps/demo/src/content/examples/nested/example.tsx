'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = { title: string; nested?: boolean };

const innerLayout: TileryInitialLayout<TabData> = {
  type: 'split',
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
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'sidebar',
      size: 30,
      tabs: [{ id: 'nav', data: { title: 'Navigation' }, closeable: false }],
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
        renderTabHeader={(tab: TileryTabHandle<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTabHandle<TabData>) => (
          <div style={{ padding: 16, color: '#9aa1ab', fontSize: 13 }}>
            {tab.data.title} (nested instance)
          </div>
        )}
      />
    </div>
  );
}

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={outerLayout}
      renderTabHeader={(tab: TileryTabHandle<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => {
        if (tab.data.nested) return <InnerTilery />;
        return (
          <div style={{ padding: 16, color: '#9aa1ab', fontSize: 13 }}>
            {tab.data.title} content
          </div>
        );
      }}
    />
  );
}
