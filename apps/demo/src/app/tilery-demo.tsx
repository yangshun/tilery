'use client';

import { useEffect, useRef, useState } from 'react';
import { Tilery } from '@tilery/react';
import type { InitialLayout, TileryHandle, TabHandle } from '@tilery/react';
import './tilery-demo.css';

type DemoTabData = {
  title: string;
  color: string;
  kind: 'text' | 'fileTree' | 'log';
};

const initialLayout: InitialLayout<DemoTabData> = {
  panels: [
    {
      id: 'sidebar',
      inset: { top: 0, right: 60, bottom: 0, left: 0 },
      tabs: [
        {
          id: 'tab-explorer',
          data: { title: 'Explorer', color: '#4f7fff', kind: 'fileTree' },
        },
      ],
    },
    {
      id: 'editor',
      inset: { top: 0, right: 0, bottom: 50, left: 40 },
      tabs: [
        {
          id: 'tab-foo',
          data: { title: 'foo.ts', color: '#3aaf6f', kind: 'text' },
        },
        {
          id: 'tab-bar',
          data: { title: 'bar.ts', color: '#d28e2a', kind: 'text' },
        },
      ],
    },
    {
      id: 'terminal',
      inset: { top: 50, right: 0, bottom: 0, left: 40 },
      tabs: [
        {
          id: 'tab-bash',
          data: { title: 'bash', color: '#9b5ad6', kind: 'log' },
        },
        {
          id: 'tab-logs',
          data: { title: 'logs', color: '#d6515a', kind: 'log' },
        },
      ],
    },
  ],
};

function TabContentBody({ tab }: { tab: TabHandle<DemoTabData> }) {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  return (
    <div className="demo-tab-content">
      <div className="demo-tab-meta">
        <span className="demo-meta-row">
          <strong>Tab id:</strong> <code>{tab.id}</code>
        </span>
        <span className="demo-meta-row">
          <strong>Panel:</strong> <code>{tab.panel.id}</code>
        </span>
      </div>
      <div className="demo-input-row">
        <span>React state counter (proves the subtree was not remounted):</span>
        <div className="demo-counter-row">
          <button
            type="button"
            data-testid={`counter-inc-${tab.id}`}
            onClick={() => setCount((c) => c + 1)}>
            +1
          </button>
          <span
            data-testid={`counter-value-${tab.id}`}
            className="demo-counter-value">
            {count}
          </span>
        </div>
      </div>
      <label className="demo-input-row">
        Controlled input (React state, not DOM defaultValue):
        <input
          type="text"
          placeholder="React state..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid={`controlled-input-${tab.id}`}
        />
      </label>
      {tab.data.kind === 'fileTree' && (
        <ul className="demo-file-tree">
          <li>src/</li>
          <li>&nbsp;&nbsp;foo.ts</li>
          <li>&nbsp;&nbsp;bar.ts</li>
          <li>package.json</li>
          <li>README.md</li>
        </ul>
      )}
      {tab.data.kind === 'text' && (
        <pre className="demo-code">{`export function ${tab.data.title.replace('.ts', '')}() {
  return 'hello from ${tab.data.title}';
}`}</pre>
      )}
      {tab.data.kind === 'log' && (
        <pre className="demo-log">
          {`> running ${tab.data.title}\n[ok] task complete\n[info] listening on port 3000\n[warn] this is mock content`}
        </pre>
      )}
    </div>
  );
}

export function TileryDemo() {
  const tileryRef = useRef<TileryHandle | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as { __tilery?: TileryHandle | null }).__tilery =
      tileryRef.current;
  });

  const renderTabHeader = (tab: TabHandle<DemoTabData>) => (
    <>
      <span className="demo-tab-dot" style={{ background: tab.data.color }} />
      <span>{tab.data.title}</span>
    </>
  );

  const renderTabContent = (tab: TabHandle<DemoTabData>) => (
    <TabContentBody tab={tab} />
  );

  const appendTabToActive = () => {
    const m = tileryRef.current;
    if (!m) return;
    const target = m.getPanels()[0];
    if (!target) return;
    counterRef.current += 1;
    const n = counterRef.current;
    target.appendTab({
      data: { title: `new-${n}.ts`, color: '#3884ff', kind: 'text' },
    });
  };
  const splitFirstPanelRight = () => {
    const m = tileryRef.current;
    if (!m) return;
    const first = m.getPanels()[0];
    if (!first) return;
    counterRef.current += 1;
    const n = counterRef.current;
    first.split('right', {
      sizePercent: 50,
      tabs: [{ data: { title: `split-${n}`, color: '#15a8a4', kind: 'text' } }],
    });
  };
  const removeFirstActiveTab = () => {
    const m = tileryRef.current;
    if (!m) return;
    const first = m.getPanels()[0];
    const tab = first?.activeTab;
    tab?.remove();
  };
  const logState = () => {
    const m = tileryRef.current;
    if (!m) return;
    console.log('[tilery state]', JSON.parse(JSON.stringify(m.getState())));
  };

  return (
    <div className="demo-root">
      <div className="demo-toolbar">
        <span className="demo-toolbar-label">Tilery demo</span>
        <button type="button" onClick={appendTabToActive}>
          appendTab(panels[0])
        </button>
        <button type="button" onClick={splitFirstPanelRight}>
          splitPanel(panels[0], right)
        </button>
        <button type="button" onClick={removeFirstActiveTab}>
          remove active tab in panels[0]
        </button>
        <button type="button" onClick={logState}>
          console.log(getState())
        </button>
      </div>
      <div className="demo-tilery-wrapper">
        <Tilery<DemoTabData>
          ref={tileryRef as React.Ref<TileryHandle>}
          initialLayout={initialLayout}
          renderTabHeader={renderTabHeader}
          renderTabContent={renderTabContent}
        />
      </div>
    </div>
  );
}
