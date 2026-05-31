'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = { title: string; color: string };

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'vertical',
  children: [
    {
      type: 'split',
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
      type: 'split',
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
        <div
          style={{
            padding: 20,
            color: '#9aa1ab',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
          {tab.data.title} widget
        </div>
      )}
    />
  );
}
