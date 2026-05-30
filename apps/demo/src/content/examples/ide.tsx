'use client';

import { Tilery } from '@tilery/react';
import type { InitialLayout, TabHandle } from '@tilery/react';

type TabData = {
  title: string;
  kind: 'explorer' | 'editor' | 'terminal';
};

const layout: InitialLayout<TabData> = {
  panels: [
    {
      id: 'sidebar',
      inset: { top: 0, right: 60, bottom: 0, left: 0 },
      tabs: [{ id: 'explorer', data: { title: 'Explorer', kind: 'explorer' } }],
    },
    {
      id: 'editor',
      inset: { top: 0, right: 0, bottom: 40, left: 40 },
      tabs: [
        { id: 'index-ts', data: { title: 'index.ts', kind: 'editor' } },
        { id: 'app-tsx', data: { title: 'app.tsx', kind: 'editor' } },
      ],
    },
    {
      id: 'terminal',
      inset: { top: 60, right: 0, bottom: 0, left: 40 },
      tabs: [{ id: 'bash', data: { title: 'Terminal', kind: 'terminal' } }],
    },
  ],
};

export const metadata = {
  slug: 'ide',
  title: 'IDE Layout',
  description: 'VS Code-like layout with sidebar, editor, and terminal.',
};

export function Example() {
  return (
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab: TabHandle<TabData>) => (
        <span>{tab.data.title}</span>
      )}
      renderTabContent={(tab: TabHandle<TabData>) => (
        <div
          style={{ padding: 16, fontSize: 13, fontFamily: 'var(--site-mono)' }}>
          {tab.data.kind === 'explorer' && (
            <div style={{ color: '#9aa1ab' }}>
              <div>src/</div>
              <div style={{ paddingLeft: 12 }}>index.ts</div>
              <div style={{ paddingLeft: 12 }}>app.tsx</div>
              <div>package.json</div>
            </div>
          )}
          {tab.data.kind === 'editor' && (
            <pre style={{ margin: 0, color: '#d9dde3' }}>
              {`export function ${tab.data.title.replace(/\.\w+$/, '')}() {\n  return 'hello';\n}`}
            </pre>
          )}
          {tab.data.kind === 'terminal' && (
            <pre style={{ margin: 0, color: '#9aa1ab' }}>
              {'$ npm run dev\n> ready on http://localhost:3000'}
            </pre>
          )}
        </div>
      )}
    />
  );
}

export const source = `import { Tilery } from '@tilery/react';
import '@tilery/react/style.css';

const layout = {
  panels: [
    {
      id: 'sidebar',
      inset: { top: 0, right: 60, bottom: 0, left: 0 },
      tabs: [{ id: 'explorer', data: { title: 'Explorer', kind: 'explorer' } }],
    },
    {
      id: 'editor',
      inset: { top: 0, right: 0, bottom: 40, left: 40 },
      tabs: [
        { id: 'index-ts', data: { title: 'index.ts', kind: 'editor' } },
        { id: 'app-tsx', data: { title: 'app.tsx', kind: 'editor' } },
      ],
    },
    {
      id: 'terminal',
      inset: { top: 60, right: 0, bottom: 0, left: 40 },
      tabs: [{ id: 'bash', data: { title: 'Terminal', kind: 'terminal' } }],
    },
  ],
};

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Tilery
        initialLayout={layout}
        renderTabHeader={(tab) => <span>{tab.data.title}</span>}
        renderTabContent={(tab) => <div>{tab.data.title}</div>}
      />
    </div>
  );
}`;
