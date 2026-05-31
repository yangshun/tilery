'use client';

import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryHandle,
  TileryInitialLayout,
  TileryPanelHandle,
  TileryTabHandle,
} from '@tilery/react';

type TabData = { title: string; body: string };

const layout: TileryInitialLayout<TabData> = {
  panels: [
    {
      id: 'explorer',
      inset: { top: 0, right: 70, bottom: 0, left: 0 },
      tabs: [
        {
          id: 'files',
          data: {
            title: 'Files',
            body: 'Project files, outlines, and search results live here.',
          },
        },
      ],
      collapsedTitle: 'Files',
      collapsible: true,
    },
    {
      id: 'editor',
      inset: { top: 0, right: 0, bottom: 38, left: 30 },
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
            body: 'Activating a tab in a collapsed panel expands it again.',
          },
        },
      ],
    },
    {
      id: 'terminal',
      inset: { top: 62, right: 0, bottom: 0, left: 30 },
      tabs: [
        {
          id: 'shell',
          data: {
            title: 'Terminal',
            body: '$ pnpm test',
          },
        },
      ],
      collapsedTitle: 'Terminal',
      collapsible: true,
    },
  ],
};

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);

  const withPanel = (id: string, fn: (panel: TileryPanelHandle) => void) => {
    const panel = tileryRef.current?.getPanel(id);
    if (panel) fn(panel);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={toolbarStyle}>
        <button
          type="button"
          onClick={() => withPanel('explorer', (panel) => panel.collapse())}
          style={btnStyle}>
          Collapse Files
        </button>
        <button
          type="button"
          onClick={() => withPanel('explorer', (panel) => panel.expand())}
          style={btnStyle}>
          Expand Files
        </button>
        <button
          type="button"
          onClick={() => withPanel('terminal', (panel) => panel.collapse())}
          style={btnStyle}>
          Collapse Terminal
        </button>
        <button
          type="button"
          onClick={() => withPanel('terminal', (panel) => panel.expand())}
          style={btnStyle}>
          Expand Terminal
        </button>
        <button
          type="button"
          onClick={() => withPanel('editor', (panel) => panel.maximize())}
          style={btnStyle}>
          Maximize Editor
        </button>
        <button
          type="button"
          onClick={() => withPanel('editor', (panel) => panel.restore())}
          style={btnStyle}>
          Restore Editor
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Tilery<TabData>
          ref={tileryRef as React.Ref<TileryHandle>}
          initialLayout={layout}
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
      </div>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: '8px 12px',
  background: '#16181c',
  borderBottom: '1px solid #2a2d33',
};

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: '#1f2127',
  color: '#d9dde3',
  border: '1px solid #2a2d33',
  borderRadius: 3,
  cursor: 'pointer',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

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
