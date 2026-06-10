'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, TabContent } from '../example-ui';

type TabData = { title: string };

// source-region dashboard-layout
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
              data: { title: 'Revenue Chart' },
              closable: false,
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
              data: { title: 'Key Metrics' },
              closable: false,
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
              data: { title: 'Data Table' },
              closable: false,
            },
          ],
        },
        {
          type: 'panel',
          id: 'bottom-right',
          size: 50,
          tabs: [
            { id: 'logs', data: { title: 'Activity Log' } },
            { id: 'alerts', data: { title: 'Alerts' } },
          ],
        },
      ],
    },
  ],
};
// end-source-region dashboard-layout

export function Example() {
  return (
    <ExampleSection
      title="Analytics workspace"
      description="Nested row and column groups create a dashboard without switching to a separate grid primitive.">
      {/* source-region dashboard-tilery */}
      <Tilery<TabData>
        initialLayout={layout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <>
            <span>{tab.data.title}</span>
          </>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent>
            <div style={widgetStyle}>{tab.data.title} widget</div>
          </TabContent>
        )}
      />
      {/* end-source-region dashboard-tilery */}
    </ExampleSection>
  );
}

const widgetStyle: React.CSSProperties = {
  height: 76,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid var(--example-demo-border-soft)',
  borderRadius: 6,
  color: 'var(--example-demo-muted)',
};
