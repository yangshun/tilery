'use client';

import { useState } from 'react';
import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';
import {
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = {
  title: string;
  summary: string;
  accent: string;
  constraints: string;
};

const constraintsLayout: TileryInitialLayout<TabData> = {
  type: 'group',
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
      type: 'group',
      direction: 'vertical',
      size: 76,
      children: [
        {
          type: 'group',
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
  type: 'group',
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

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) 214px">
      <PanelConstraintsExample />
      <ContainerResizeExample />
    </ExampleStack>
  );
}

// source-region panel-constraints
export function PanelConstraintsExample() {
  return (
    <ExampleSection
      title="Panel constraints"
      description="Drag the dividers to see per-panel minSize and maxSize limits clamp resizing.">
      <Tilery<TabData>
        initialLayout={constraintsLayout}
        minSize={10}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region panel-constraints

// source-region container-resize
export function ContainerResizeExample() {
  const [width, setWidth] = useState(widths[2]!.value);

  return (
    <ExampleSection
      title="Container resize"
      description="Shrink the wrapper to see split proportions normalize only when measured constraints require it."
      frameStyle={resizerTrackStyle}
      actions={widths.map((item) => (
        <ExampleButton
          key={item.value}
          type="button"
          active={width === item.value}
          onClick={() => setWidth(item.value)}>
          {item.label}
        </ExampleButton>
      ))}>
      <div style={{ ...resizerFrameStyle, width }}>
        <Tilery<TabData>
          initialLayout={containerResizeLayout}
          minSize={10}
          renderTabHeader={renderHeader}
          renderTabContent={renderContent}
        />
      </div>
    </ExampleSection>
  );
}
// end-source-region container-resize

function renderHeader(tab: TileryTabHandle<TabData>) {
  return (
    <>
      <span
        style={{
          ...swatchStyle,
          background: tab.data.accent,
        }}
      />
      <span>{tab.data.title}</span>
    </>
  );
}

function renderContent(tab: TileryTabHandle<TabData>) {
  return (
    <TabContent meta={tab.data.constraints}>
      <p style={{ margin: 0 }}>{tab.data.summary}</p>
    </TabContent>
  );
}

const resizerTrackStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  background: '#101318',
};

const resizerFrameStyle: React.CSSProperties = {
  height: '100%',
  maxWidth: '100%',
  transition: 'width 180ms ease',
};

const swatchStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
};
