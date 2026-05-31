'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = {
  title: string;
  summary: string;
  accent: string;
  constraints: string;
};

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 24,
      minSize: 18,
      maxSize: 34,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            summary: 'This sidebar can resize, but it stays narrow.',
            accent: '#3aaf6f',
            constraints: 'minSize: 18, maxSize: 34',
          },
          closeable: false,
        },
      ],
    },
    {
      type: 'split',
      direction: 'vertical',
      size: 76,
      children: [
        {
          type: 'split',
          direction: 'horizontal',
          size: 68,
          children: [
            {
              type: 'panel',
              id: 'editor',
              size: 68,
              minSize: 36,
              tabs: [
                {
                  id: 'editor-tab',
                  data: {
                    title: 'Editor',
                    summary:
                      'The main work area keeps enough room for readable content.',
                    accent: '#3884ff',
                    constraints: 'minSize: 36',
                  },
                },
              ],
            },
            {
              type: 'panel',
              id: 'inspector',
              size: 32,
              minSize: 18,
              maxSize: 36,
              tabs: [
                {
                  id: 'inspector-tab',
                  data: {
                    title: 'Inspector',
                    summary: 'The right panel is bounded on both sides.',
                    accent: '#d28e2a',
                    constraints: 'minSize: 18, maxSize: 36',
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'panel',
          id: 'console',
          size: 32,
          minSize: 18,
          maxSize: 42,
          tabs: [
            {
              id: 'console-tab',
              data: {
                title: 'Console',
                summary:
                  'The bottom panel has vertical constraints independent of the side panels.',
                accent: '#9b5ad6',
                constraints: 'minSize: 18, maxSize: 42',
              },
              closeable: false,
            },
          ],
        },
      ],
    },
  ],
};

const panelStyle: React.CSSProperties = {
  height: '100%',
  padding: 16,
  color: '#d9dde3',
  fontSize: 13,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '3px 8px',
  borderRadius: 4,
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#9aa1ab',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      minSize={10}
      renderTabHeader={(tab: TileryTabHandle<TabData>) => (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tab.data.accent,
            }}
          />
          <span>{tab.data.title}</span>
        </>
      )}
      renderTabContent={(tab: TileryTabHandle<TabData>) => (
        <div style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {tab.data.title}
          </h2>
          <p style={{ margin: 0, color: '#9aa1ab', lineHeight: 1.5 }}>
            {tab.data.summary}
          </p>
          <span style={badgeStyle}>{tab.data.constraints}</span>
        </div>
      )}
    />
  );
}
