'use client';

import { useState } from 'react';
import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import {
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = {
  title: string;
  summary: string;
  constraints: string;
};

// source-region panel-constraints-layout
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
            constraints: 'minSize: 180px, maxSize: 34%',
          },
          closable: false,
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
                constraints: 'minSize: 140px, maxSize: 42%',
              },
              closable: false,
            },
          ],
        },
      ],
    },
  ],
};
// end-source-region panel-constraints-layout

// source-region container-resize-layout
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
            constraints: 'minSize: 240px',
          },
          closable: false,
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
            constraints: 'minSize: 220px',
          },
        },
      ],
    },
  ],
};
// end-source-region container-resize-layout

// source-region default-reset-layout
const defaultResetLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'reset-navigator',
      size: 50,
      defaultSize: 30,
      minSize: '180px',
      tabs: [
        {
          id: 'reset-navigator-tab',
          data: {
            title: 'Navigator',
            summary:
              'Double-click the divider to return this panel to its 30% reset target.',
            constraints: 'size: 50, defaultSize: 30, minSize: 180px',
          },
          closable: false,
        },
      ],
    },
    {
      type: 'panel',
      id: 'reset-editor',
      size: 50,
      defaultSize: 70,
      minSize: '220px',
      tabs: [
        {
          id: 'reset-editor-tab',
          data: {
            title: 'Editor',
            summary:
              'Reset keeps the default ratio stable even after several manual resizes.',
            constraints: 'size: 50, defaultSize: 70, minSize: 220px',
          },
        },
      ],
    },
  ],
};
// end-source-region default-reset-layout

const widths = [
  { label: 'Narrow', value: 480 },
  { label: 'Medium', value: 640 },
  { label: 'Wide', value: 820 },
];

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) 214px 214px">
      <PanelConstraintsExample />
      <ContainerResizeExample />
      <DefaultResetExample />
    </ExampleStack>
  );
}

export function PanelConstraintsExample() {
  return (
    <ExampleSection
      title="Panel constraints"
      description="Drag the dividers to see per-panel minSize and maxSize limits clamp resizing.">
      {/* source-region panel-constraints-tilery */}
      <Tilery<TabData>
        initialLayout={constraintsLayout}
        minSize={10}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
      {/* end-source-region panel-constraints-tilery */}
    </ExampleSection>
  );
}

export function ContainerResizeExample() {
  // source-region container-resize-state
  const [width, setWidth] = useState(widths[2]!.value);
  // end-source-region container-resize-state

  return (
    <ExampleSection
      title="Container resize"
      description="Shrink the wrapper to see split proportions normalize only when measured constraints require it."
      frameStyle={resizerTrackStyle}
      isDirty={width !== widths[2]!.value}
      onReset={() => setWidth(widths[2]!.value)}
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
        {/* source-region container-resize-tilery */}
        <Tilery<TabData>
          initialLayout={containerResizeLayout}
          minSize={10}
          renderTabHeader={renderHeader}
          renderTabContent={renderContent}
        />
        {/* end-source-region container-resize-tilery */}
      </div>
    </ExampleSection>
  );
}

export function DefaultResetExample() {
  return (
    <ExampleSection
      title="Default reset"
      description="Drag the divider, then double-click it. Tilery restores the defaultSize ratio and still applies minSize/maxSize limits.">
      {/* source-region default-reset-tilery */}
      <Tilery<TabData>
        initialLayout={defaultResetLayout}
        minSize={10}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
      {/* end-source-region default-reset-tilery */}
    </ExampleSection>
  );
}

function renderHeader(tab: TileryTab<TabData>) {
  return (
    <>
      <span>{tab.data.title}</span>
    </>
  );
}

function renderContent(tab: TileryTab<TabData>) {
  return (
    <TabContent meta={tab.data.constraints}>
      <p style={{ margin: 0 }}>{tab.data.summary}</p>
    </TabContent>
  );
}

const resizerTrackStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  background: 'var(--example-demo-code-bg)',
};

const resizerFrameStyle: React.CSSProperties = {
  height: '100%',
  maxWidth: '100%',
  transition: 'width 180ms ease',
};
