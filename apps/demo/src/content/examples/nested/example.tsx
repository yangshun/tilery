'use client';

import { Tilery } from '@tilery/react';
import type { InitialLayout, TabHandle } from '@tilery/react';

type TabData = { title: string; nested?: boolean };

const innerLayout: InitialLayout<TabData> = {
  panels: [
    {
      id: 'inner-left',
      inset: { top: 0, right: 50, bottom: 0, left: 0 },
      tabs: [{ id: 'inner-a', data: { title: 'Inner A' } }],
    },
    {
      id: 'inner-right',
      inset: { top: 0, right: 0, bottom: 0, left: 50 },
      tabs: [{ id: 'inner-b', data: { title: 'Inner B' } }],
    },
  ],
};

const outerLayout: InitialLayout<TabData> = {
  panels: [
    {
      id: 'sidebar',
      inset: { top: 0, right: 70, bottom: 0, left: 0 },
      tabs: [{ id: 'nav', data: { title: 'Navigation' }, closeable: false }],
    },
    {
      id: 'main',
      inset: { top: 0, right: 0, bottom: 0, left: 30 },
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
        renderTabHeader={(tab: TabHandle<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TabHandle<TabData>) => (
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
      renderTabHeader={(tab: TabHandle<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TabHandle<TabData>) => {
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
