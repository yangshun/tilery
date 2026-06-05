'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, TabContent } from '../example-ui';

type TabData = {
  title: string;
  kind: 'explorer' | 'search' | 'outline' | 'editor' | 'terminal' | 'problems';
};

const layout: TileryInitialLayout<TabData> = {
  type: 'root',
  main: {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'editor-a',
        size: 58,
        tabs: [
          { id: 'index-ts', data: { title: 'index.ts', kind: 'editor' } },
          { id: 'router-ts', data: { title: 'router.ts', kind: 'editor' } },
        ],
      },
      {
        type: 'panel',
        id: 'editor-b',
        size: 42,
        tabs: [{ id: 'preview', data: { title: 'Preview', kind: 'editor' } }],
      },
    ],
  },
  edges: {
    left: {
      type: 'edgePanel',
      id: 'left-tools',
      size: 22,
      minSize: 14,
      maxSize: 34,
      tabs: [
        {
          id: 'explorer',
          data: { title: 'Explorer', kind: 'explorer' },
          closable: false,
        },
        { id: 'search', data: { title: 'Search', kind: 'search' } },
      ],
    },
    right: {
      type: 'edgePanel',
      id: 'right-tools',
      size: 18,
      minSize: 12,
      maxSize: 28,
      tabs: [{ id: 'outline', data: { title: 'Outline', kind: 'outline' } }],
    },
    bottom: {
      type: 'edgePanel',
      id: 'bottom-tools',
      size: 28,
      minSize: 18,
      maxSize: 42,
      tabs: [
        {
          id: 'terminal',
          data: { title: 'Terminal', kind: 'terminal' },
          closable: false,
        },
        { id: 'problems', data: { title: 'Problems', kind: 'problems' } },
      ],
    },
  },
};

export function Example() {
  return (
    <ExampleSection
      title="Pinned edge workspace"
      description="Left, right, and bottom edge panels stay anchored around the center tiled grid.">
      <Tilery<TabData>
        initialLayout={layout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent meta={panelKindLabel(tab.panel.kind)}>
            {renderContent(tab)}
          </TabContent>
        )}
      />
    </ExampleSection>
  );
}

function renderContent(tab: TileryTab<TabData>) {
  if (tab.data.kind === 'editor') {
    return (
      <pre style={codeBlockStyle}>
        {`export function ${tab.data.title.replace(/\.\w+$/, '')}() {\n  return workspace.open('${tab.data.title}');\n}`}
      </pre>
    );
  }
  if (tab.data.kind === 'explorer') {
    return (
      <div style={monoBlockStyle}>
        <div>src/</div>
        <div style={{ paddingLeft: 12 }}>index.ts</div>
        <div style={{ paddingLeft: 12 }}>router.ts</div>
        <div style={{ paddingLeft: 12 }}>components/</div>
        <div>package.json</div>
      </div>
    );
  }
  if (tab.data.kind === 'search') {
    return <div style={listStyle}>3 matches for "workspace"</div>;
  }
  if (tab.data.kind === 'outline') {
    return (
      <div style={monoBlockStyle}>
        <div>WorkspaceShell</div>
        <div>useOpenResource</div>
        <div>renderTabContent</div>
      </div>
    );
  }
  if (tab.data.kind === 'terminal') {
    return (
      <pre style={monoBlockStyle}>
        {'$ pnpm dev\n> ready on http://localhost:3000'}
      </pre>
    );
  }
  return <div style={listStyle}>No blocking diagnostics.</div>;
}

function panelKindLabel(kind: string) {
  return kind === 'edge' ? 'pinned edge panel' : 'main tiled panel';
}

const monoBlockStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--example-demo-muted)',
  fontFamily: 'var(--site-mono)',
  fontSize: 13,
};

const codeBlockStyle: React.CSSProperties = {
  ...monoBlockStyle,
  color: 'var(--example-demo-fg)',
};

const listStyle: React.CSSProperties = {
  color: 'var(--example-demo-muted)',
};
