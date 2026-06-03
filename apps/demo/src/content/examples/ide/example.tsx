'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { TabContent } from '../example-ui';

type TabData = {
  title: string;
  kind: 'explorer' | 'editor' | 'terminal';
};

// source-region nested-terminal
const layout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'sidebar',
      size: 40,
      tabs: [
        {
          id: 'explorer',
          data: { title: 'Explorer', kind: 'explorer' },
          closeable: false,
        },
      ],
    },
    {
      type: 'group',
      direction: 'vertical',
      size: 60,
      children: [
        {
          type: 'panel',
          id: 'editor',
          size: 60,
          tabs: [
            { id: 'index-ts', data: { title: 'index.ts', kind: 'editor' } },
            { id: 'app-tsx', data: { title: 'app.tsx', kind: 'editor' } },
          ],
        },
        {
          type: 'panel',
          id: 'terminal',
          size: 40,
          tabs: [
            {
              id: 'bash',
              data: { title: 'Terminal', kind: 'terminal' },
              closeable: false,
            },
          ],
        },
      ],
    },
  ],
};

export function Example() {
  return <IdeDemo layout={layout} />;
}
// end-source-region nested-terminal

// source-region root-bottom-row
const rootBottomRowLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'vertical',
  children: [
    {
      type: 'panel',
      id: 'editor',
      size: 40,
      tabs: [
        { id: 'index-ts', data: { title: 'index.ts', kind: 'editor' } },
        { id: 'app-tsx', data: { title: 'app.tsx', kind: 'editor' } },
      ],
    },
    {
      type: 'panel',
      id: 'terminal',
      size: 26.6666666667,
      tabs: [
        {
          id: 'bash',
          data: { title: 'Terminal', kind: 'terminal' },
          closeable: false,
        },
      ],
    },
    {
      type: 'panel',
      id: 'sidebar',
      size: 33.3333333333,
      tabs: [
        {
          id: 'explorer',
          data: { title: 'Explorer', kind: 'explorer' },
          closeable: false,
        },
      ],
    },
  ],
};

export function RootBottomRowExample() {
  return <IdeDemo layout={rootBottomRowLayout} />;
}
// end-source-region root-bottom-row

function IdeDemo({ layout }: { layout: TileryInitialLayout<TabData> }) {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab: TileryTab<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TileryTab<TabData>) => (
        <TabContent>
          {tab.data.kind === 'explorer' && (
            <div style={monoBlockStyle}>
              <div>src/</div>
              <div style={{ paddingLeft: 12 }}>index.ts</div>
              <div style={{ paddingLeft: 12 }}>app.tsx</div>
              <div>package.json</div>
            </div>
          )}
          {tab.data.kind === 'editor' && (
            <pre style={codeBlockStyle}>
              {`export function ${tab.data.title.replace(/\.\w+$/, '')}() {\n  return 'hello';\n}`}
            </pre>
          )}
          {tab.data.kind === 'terminal' && (
            <pre style={monoBlockStyle}>
              {'$ npm run dev\n> ready on http://localhost:3000'}
            </pre>
          )}
        </TabContent>
      )}
    />
  );
}

const monoBlockStyle: React.CSSProperties = {
  margin: 0,
  color: '#9aa1ab',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};

const codeBlockStyle: React.CSSProperties = {
  ...monoBlockStyle,
  color: '#d9dde3',
};
