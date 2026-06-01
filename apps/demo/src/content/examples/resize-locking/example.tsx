'use client';

import { useState } from 'react';
import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = {
  title: string;
  detail: string;
  tone: string;
  badge: string;
};

const layout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 26,
      locked: true,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            detail: 'Pinned workspace tree with a locked tab',
            tone: '#3aaf6f',
            badge: 'panel and tab locked',
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
                    detail: 'Resizable work surface',
                    tone: '#3884ff',
                    badge: 'resizable',
                  },
                },
              ],
            },
            {
              type: 'panel',
              id: 'preview',
              size: 36,
              resizable: false,
              tabs: [
                {
                  id: 'preview-tab',
                  data: {
                    title: 'Preview',
                    detail: 'Fixed divider, still accepts tabs',
                    tone: '#d28e2a',
                    badge: 'resize locked',
                  },
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
                detail: 'Bottom panel',
                tone: '#9b5ad6',
                badge: 'resizable',
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
  const [resizable, setResizable] = useState(true);

  return (
    <div style={shellStyle}>
      <div style={toolbarStyle}>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={resizable}
            onChange={(event) => setResizable(event.currentTarget.checked)}
          />
          <span>Resize handles</span>
        </label>
        <span style={statusStyle}>{resizable ? 'enabled' : 'disabled'}</span>
      </div>
      <div style={frameStyle}>
        <Tilery<TabData>
          initialLayout={layout}
          resizable={resizable}
          renderTabHeader={(tab: TileryTabHandle<TabData>) => (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: tab.data.tone,
                }}
              />
              <span>{tab.data.title}</span>
            </>
          )}
          renderTabContent={(tab: TileryTabHandle<TabData>) => (
            <div style={panelStyle}>
              <div
                style={{
                  width: 32,
                  height: 4,
                  borderRadius: 2,
                  background: tab.data.tone,
                }}
              />
              <h2 style={titleStyle}>{tab.data.title}</h2>
              <p style={detailStyle}>{tab.data.detail}</p>
              <span style={badgeStyle}>{tab.data.badge}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  height: '100%',
  minHeight: 0,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 12px',
  background: '#16181c',
  borderBottom: '1px solid #2a2d33',
  color: '#d9dde3',
  fontSize: 12,
};

const toggleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
};

const statusStyle: React.CSSProperties = {
  padding: '3px 8px',
  border: '1px solid #2a2d33',
  borderRadius: 4,
  color: '#9aa1ab',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

const frameStyle: React.CSSProperties = {
  minHeight: 0,
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

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
};

const detailStyle: React.CSSProperties = {
  margin: 0,
  color: '#9aa1ab',
  lineHeight: 1.5,
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
