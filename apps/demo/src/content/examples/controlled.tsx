'use client';

import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import type { InitialLayout, TabHandle, TileryHandle } from '@tilery/react';

type TabData = { title: string };

const layout: InitialLayout<TabData> = {
  panels: [
    {
      id: 'main',
      inset: { top: 0, right: 0, bottom: 0, left: 0 },
      tabs: [{ id: 'welcome', data: { title: 'Welcome' } }],
    },
  ],
};

export const metadata = {
  slug: 'controlled',
  title: 'Programmatic Control',
  description: 'Use the imperative API to add, remove, and move tabs.',
};

let counter = 0;

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);

  const addTab = () => {
    const m = tileryRef.current;
    if (!m) return;
    const panels = m.getPanels();
    if (panels.length === 0) return;
    counter++;
    panels[0]!.appendTab({ data: { title: `Tab ${counter}` } });
  };

  const splitRight = () => {
    const m = tileryRef.current;
    if (!m) return;
    const panels = m.getPanels();
    if (panels.length === 0) return;
    counter++;
    panels[0]!.split('right', {
      sizePercent: 50,
      tabs: [{ data: { title: `Split ${counter}` } }],
    });
  };

  const removeActive = () => {
    const m = tileryRef.current;
    if (!m) return;
    const panels = m.getPanels();
    if (panels.length === 0) return;
    panels[0]!.activeTab?.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '8px 12px',
          background: '#16181c',
          borderBottom: '1px solid #2a2d33',
          fontSize: 12,
        }}>
        <button type="button" onClick={addTab} style={btnStyle}>
          Add Tab
        </button>
        <button type="button" onClick={splitRight} style={btnStyle}>
          Split Right
        </button>
        <button type="button" onClick={removeActive} style={btnStyle}>
          Remove Active
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Tilery<TabData>
          ref={tileryRef as React.Ref<TileryHandle>}
          initialLayout={layout}
          renderTabHeader={(tab: TabHandle<TabData>) => (
            <span>{tab.data.title}</span>
          )}
          renderTabContent={(tab: TabHandle<TabData>) => (
            <div style={{ padding: 16, color: '#9aa1ab', fontSize: 13 }}>
              {tab.data.title}
            </div>
          )}
        />
      </div>
    </div>
  );
}

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

export const source = `import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import '@tilery/react/style.css';
import type { TileryHandle } from '@tilery/react';

function App() {
  const tileryRef = useRef<TileryHandle>(null);

  const addTab = () => {
    const panels = tileryRef.current?.getPanels();
    panels?.[0]?.appendTab({ data: { title: 'New Tab' } });
  };

  const splitRight = () => {
    const panels = tileryRef.current?.getPanels();
    panels?.[0]?.split('right', {
      sizePercent: 50,
      tabs: [{ data: { title: 'Split' } }],
    });
  };

  const removeActive = () => {
    const panels = tileryRef.current?.getPanels();
    panels?.[0]?.activeTab?.remove();
  };

  return (
    <>
      <button onClick={addTab}>Add Tab</button>
      <button onClick={splitRight}>Split Right</button>
      <button onClick={removeActive}>Remove Active</button>
      <Tilery ref={tileryRef} initialLayout={layout} ... />
    </>
  );
}`;
