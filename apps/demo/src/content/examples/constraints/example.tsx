'use client';

import { useState } from 'react';
import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';

type TabData = {
  title: string;
  summary: string;
  accent: string;
  constraints: string;
};

const constraintsLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 24,
      minSize: '180px',
      maxSize: '34%',
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            summary: 'This sidebar can resize, but it stays narrow.',
            accent: '#3aaf6f',
            constraints: 'minSize: 180px, maxSize: 34%',
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
              minSize: '320px',
              tabs: [
                {
                  id: 'editor-tab',
                  data: {
                    title: 'Editor',
                    summary:
                      'The main work area keeps enough room for readable content.',
                    accent: '#3884ff',
                    constraints: 'minSize: 320px',
                  },
                },
              ],
            },
            {
              type: 'panel',
              id: 'inspector',
              size: 32,
              minSize: '180px',
              maxSize: '36%',
              tabs: [
                {
                  id: 'inspector-tab',
                  data: {
                    title: 'Inspector',
                    summary: 'The right panel is bounded on both sides.',
                    accent: '#d28e2a',
                    constraints: 'minSize: 180px, maxSize: 36%',
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
          minSize: '140px',
          maxSize: '42%',
          tabs: [
            {
              id: 'console-tab',
              data: {
                title: 'Console',
                summary:
                  'The bottom panel has vertical constraints independent of the side panels.',
                accent: '#9b5ad6',
                constraints: 'minSize: 140px, maxSize: 42%',
              },
              closeable: false,
            },
          ],
        },
      ],
    },
  ],
};

const containerResizeLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'resize-sidebar',
      size: 40,
      minSize: '240px',
      tabs: [
        {
          id: 'resize-sidebar-tab',
          data: {
            title: 'Sidebar',
            summary: 'This panel keeps at least 240px as the wrapper narrows.',
            accent: '#3aaf6f',
            constraints: 'minSize: 240px',
          },
          closeable: false,
        },
      ],
    },
    {
      type: 'panel',
      id: 'resize-workspace',
      size: 60,
      minSize: '220px',
      tabs: [
        {
          id: 'resize-workspace-tab',
          data: {
            title: 'Workspace',
            summary:
              'Proportions stay stable until a measured constraint needs space.',
            accent: '#3884ff',
            constraints: 'minSize: 220px',
          },
        },
      ],
    },
  ],
};

const widths = [
  { label: 'Narrow', value: 480 },
  { label: 'Medium', value: 640 },
  { label: 'Wide', value: 820 },
];

const rootStyle: React.CSSProperties = {
  height: '100%',
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr) 214px',
  gap: 12,
  padding: 12,
  background: '#14171d',
};

const exampleBlockStyle: React.CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 8,
};

const blockHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  color: '#d9dde3',
  fontSize: 12,
  fontWeight: 600,
};

const frameStyle: React.CSSProperties = {
  minHeight: 0,
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
};

const resizerTrackStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  justifyContent: 'center',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
  background: '#101318',
};

const resizerFrameStyle: React.CSSProperties = {
  height: '100%',
  maxWidth: '100%',
  transition: 'width 180ms ease',
};

const controlGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: 4,
};

const controlButtonStyle: React.CSSProperties = {
  height: 26,
  padding: '0 9px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 4,
  background: 'transparent',
  color: '#9aa1ab',
  font: 'inherit',
  cursor: 'pointer',
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

function renderHeader(tab: TileryTabHandle<TabData>) {
  return (
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
  );
}

function renderContent(tab: TileryTabHandle<TabData>) {
  return (
    <div style={panelStyle}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
        {tab.data.title}
      </h2>
      <p style={{ margin: 0, color: '#9aa1ab', lineHeight: 1.5 }}>
        {tab.data.summary}
      </p>
      <span style={badgeStyle}>{tab.data.constraints}</span>
    </div>
  );
}

export function Example() {
  const [width, setWidth] = useState(widths[2]!.value);

  return (
    <div style={rootStyle}>
      <div style={exampleBlockStyle}>
        <div style={blockHeaderStyle}>Panel constraints</div>
        <div style={frameStyle}>
          <Tilery<TabData>
            initialLayout={constraintsLayout}
            minSize={10}
            renderTabHeader={renderHeader}
            renderTabContent={renderContent}
          />
        </div>
      </div>
      <div style={exampleBlockStyle}>
        <div style={blockHeaderStyle}>
          <span>Container resize</span>
          <div style={controlGroupStyle}>
            {widths.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setWidth(item.value)}
                style={{
                  ...controlButtonStyle,
                  background:
                    width === item.value
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'transparent',
                  color: width === item.value ? '#f1f4f8' : '#9aa1ab',
                }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div style={resizerTrackStyle}>
          <div style={{ ...resizerFrameStyle, width }}>
            <Tilery<TabData>
              initialLayout={containerResizeLayout}
              minSize={10}
              renderTabHeader={renderHeader}
              renderTabContent={renderContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
