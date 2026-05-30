'use client';

import { Tilery } from '@tilery/react';
import type { InitialLayout, TabHandle } from '@tilery/react';

type TabData = { title: string; color: string };

const layout: InitialLayout<TabData> = {
  panels: [
    {
      id: 'top-left',
      inset: { top: 0, right: 50, bottom: 50, left: 0 },
      tabs: [
        {
          id: 'chart',
          data: { title: 'Revenue Chart', color: '#3aaf6f' },
          closeable: false,
        },
      ],
    },
    {
      id: 'top-right',
      inset: { top: 0, right: 0, bottom: 50, left: 50 },
      tabs: [
        {
          id: 'metrics',
          data: { title: 'Key Metrics', color: '#3884ff' },
          closeable: false,
        },
      ],
    },
    {
      id: 'bottom-left',
      inset: { top: 50, right: 50, bottom: 0, left: 0 },
      tabs: [
        {
          id: 'table',
          data: { title: 'Data Table', color: '#d28e2a' },
          closeable: false,
        },
      ],
    },
    {
      id: 'bottom-right',
      inset: { top: 50, right: 0, bottom: 0, left: 50 },
      tabs: [
        { id: 'logs', data: { title: 'Activity Log', color: '#9b5ad6' } },
        { id: 'alerts', data: { title: 'Alerts', color: '#d6515a' } },
      ],
    },
  ],
};

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab: TabHandle<TabData>) => (
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
      renderTabContent={(tab: TabHandle<TabData>) => (
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
