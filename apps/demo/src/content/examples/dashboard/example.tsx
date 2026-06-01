'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';
import { TabContent } from '../example-ui';

type TabData = { title: string; color: string };

const layout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      direction: 'horizontal',
      size: 50,
      children: [
        {
          type: 'panel',
          id: 'top-left',
          size: 50,
          tabs: [
            {
              id: 'chart',
              data: { title: 'Revenue Chart', color: '#3aaf6f' },
              closeable: false,
            },
          ],
        },
        {
          type: 'panel',
          id: 'top-right',
          size: 50,
          tabs: [
            {
              id: 'metrics',
              data: { title: 'Key Metrics', color: '#3884ff' },
              closeable: false,
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      direction: 'horizontal',
      size: 50,
      children: [
        {
          type: 'panel',
          id: 'bottom-left',
          size: 50,
          tabs: [
            {
              id: 'table',
              data: { title: 'Data Table', color: '#d28e2a' },
              closeable: false,
            },
          ],
        },
        {
          type: 'panel',
          id: 'bottom-right',
          size: 50,
          tabs: [
            { id: 'logs', data: { title: 'Activity Log', color: '#9b5ad6' } },
            { id: 'alerts', data: { title: 'Alerts', color: '#d6515a' } },
          ],
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab: TileryTabHandle<TabData>) => (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tab.data.color,
            }}
          />
          <span>{tab.data.title}</span>
        </>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => (
        <TabContent>
          <div style={widgetStyle}>{tab.data.title} widget</div>
        </TabContent>
      )}
    />
  );
}

const widgetStyle: React.CSSProperties = {
  height: 76,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 6,
  color: '#9aa1ab',
};
