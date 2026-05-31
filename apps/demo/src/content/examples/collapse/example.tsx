'use client';

import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryHandle,
  TileryInitialLayout,
  TileryTabHandle,
} from '@tilery/react';

type TabData = { title: string; body: string };

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'explorer',
      size: 30,
      tabs: [
        {
          id: 'files',
          data: {
            title: 'Files',
            body: 'Project files, outlines, and search results live here.',
          },
        },
      ],
    },
    {
      type: 'split',
      direction: 'vertical',
      size: 70,
      children: [
        {
          type: 'panel',
          id: 'editor',
          size: 62,
          tabs: [
            {
              id: 'readme',
              data: {
                title: 'README.md',
                body: 'The editor panel can be maximized and restored without changing its stored inset.',
              },
            },
            {
              id: 'notes',
              data: {
                title: 'Notes',
                body: 'Panel actions can add custom commands alongside built-in layout operations.',
              },
            },
          ],
        },
        {
          type: 'panel',
          id: 'terminal',
          size: 38,
          tabs: [
            {
              id: 'shell',
              data: {
                title: 'Terminal',
                body: '$ pnpm test',
              },
            },
          ],
        },
      ],
    },
  ],
};

let newTabCounter = 0;

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);

  return (
    <Tilery<TabData>
      ref={tileryRef as React.Ref<TileryHandle>}
      initialLayout={layout}
      showActionsButton={true}
      showNewTabButton={(panel) => panel.id === 'editor'}
      onNewTab={(panel) => {
        newTabCounter += 1;
        return {
          id: `${panel.id}-new-${newTabCounter}`,
          data: {
            title: `Draft ${newTabCounter}`,
            body: 'New tabs can be supplied by the host application.',
          },
        };
      }}
      renderPanelActions={(panel, ctx) =>
        panel.id === 'editor' ? (
          <button
            type="button"
            className="tilery__panel-menu-item"
            onClick={() => {
              panel.setActiveTab('readme');
              ctx.closeMenu();
            }}>
            Focus README
          </button>
        ) : null
      }
      renderTabHeader={(tab: TileryTabHandle<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => (
        <div style={contentStyle}>
          <h2 style={headingStyle}>{tab.data.title}</h2>
          <p style={bodyStyle}>{tab.data.body}</p>
        </div>
      )}
    />
  );
}

const contentStyle: React.CSSProperties = {
  height: '100%',
  padding: 16,
  color: '#9aa1ab',
  fontSize: 13,
  lineHeight: 1.5,
};

const headingStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#f3f4f7',
  fontSize: 14,
};

const bodyStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: 0,
};
