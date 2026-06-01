'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = {
  title: string;
};

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 26,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
          },
          locked: true,
        },
      ],
    },
    {
      type: 'split',
      direction: 'vertical',
      size: 74,
      children: [
        {
          type: 'split',
          direction: 'horizontal',
          size: 68,
          children: [
            {
              type: 'panel',
              id: 'editor',
              size: 64,
              tabs: [
                {
                  id: 'editor-tab',
                  data: {
                    title: 'Editor',
                  },
                },
              ],
            },
            {
              type: 'panel',
              id: 'preview',
              size: 36,
              tabs: [
                {
                  id: 'preview-tab',
                  data: {
                    title: 'Preview',
                  },
                  draggable: false,
                },
              ],
            },
          ],
        },
        {
          type: 'panel',
          id: 'terminal',
          size: 32,
          tabs: [
            {
              id: 'terminal-tab',
              data: {
                title: 'Terminal',
              },
              closeable: false,
            },
          ],
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <div style={frameStyle}>
      <Tilery<TabData>
        initialLayout={layout}
        renderTabHeader={(tab: TileryTabHandle<TabData>) => tab.data.title}
        renderTabContent={(tab: TileryTabHandle<TabData>) => (
          <div style={panelStyle}>
            <TabBehaviorControls tab={tab} />
          </div>
        )}
      />
    </div>
  );
}

function TabBehaviorControls({ tab }: { tab: TileryTabHandle<TabData> }) {
  const locked = !tab.closeable && !tab.draggable;
  return (
    <div style={tabControlsStyle}>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          tab.setBehavior(
            locked ? { closeable: true, draggable: true } : { locked: true },
          )
        }>
        {locked ? 'Unlock tab' : 'Lock tab'}
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => tab.setBehavior({ closeable: !tab.closeable })}>
        {tab.closeable ? 'Disable close' : 'Enable close'}
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => tab.setBehavior({ draggable: !tab.draggable })}>
        {tab.draggable ? 'Disable drag' : 'Enable drag'}
      </button>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  height: 26,
  padding: '0 9px',
  border: '1px solid #2a2d33',
  borderRadius: 4,
  background: '#1f2329',
  color: '#d9dde3',
  fontFamily: 'var(--site-sans)',
  fontSize: 12,
  cursor: 'pointer',
};

const frameStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
};

const panelStyle: React.CSSProperties = {
  height: '100%',
  padding: 16,
  color: '#d9dde3',
  fontSize: 13,
  display: 'flex',
  alignItems: 'flex-start',
};

const tabControlsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 2,
};
