'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';
import { TabContent } from '../example-ui';

type TabData = {
  title: string;
  behavior: string;
  body: string;
};

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 28,
      locked: true,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            behavior: 'locked: true',
            body: 'This panel cannot be resized, dragged from, or used as a drop target.',
          },
          closeable: false,
        },
      ],
    },
    {
      type: 'split',
      direction: 'vertical',
      size: 72,
      children: [
        {
          type: 'panel',
          id: 'editor',
          size: 62,
          tabs: [
            {
              id: 'editor-tab',
              data: {
                title: 'Editor',
                behavior: 'default behavior',
                body: 'This panel remains fully interactive.',
              },
            },
            {
              id: 'outline-tab',
              data: {
                title: 'Outline',
                behavior: 'default behavior',
                body: 'Drag this tab to test drop targets around the layout.',
              },
            },
          ],
        },
        {
          type: 'split',
          direction: 'horizontal',
          size: 38,
          children: [
            {
              type: 'panel',
              id: 'terminal',
              size: 50,
              draggable: false,
              tabs: [
                {
                  id: 'terminal-tab',
                  data: {
                    title: 'Terminal',
                    behavior: 'draggable: false',
                    body: 'Tabs in this panel cannot be dragged out by panel-level policy.',
                  },
                },
              ],
            },
            {
              type: 'panel',
              id: 'reference',
              size: 50,
              droppable: false,
              tabs: [
                {
                  id: 'reference-tab',
                  data: {
                    title: 'Reference',
                    behavior: 'droppable: false',
                    body: 'Other tabs cannot be dropped into or split over this panel.',
                  },
                },
              ],
            },
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
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => (
        <TabContent meta={tab.data.behavior}>
          <p style={{ margin: 0 }}>{tab.data.body}</p>
        </TabContent>
      )}
    />
  );
}
