'use client';

import { useRef, useCallback } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryInitialLayout,
  TileryLayoutState,
  TileryTabHandle,
  TileryHandle,
} from '@tilery/react';

type TabData = { title: string };

const defaultLayout: TileryInitialLayout<TabData> = {
  panels: [
    {
      id: 'left',
      inset: { top: 0, right: 50, bottom: 0, left: 0 },
      tabs: [{ id: 'notes', data: { title: 'Notes' } }],
    },
    {
      id: 'right',
      inset: { top: 0, right: 0, bottom: 0, left: 50 },
      tabs: [{ id: 'preview', data: { title: 'Preview' } }],
    },
  ],
};

const STORAGE_KEY = 'tilery-example-persistence';

function getInitialLayout(): TileryInitialLayout<TabData> {
  if (typeof window === 'undefined') return defaultLayout;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultLayout;
  try {
    const state = JSON.parse(saved) as TileryLayoutState;
    return {
      panels: Object.values(state.panels).map((p) => ({
        id: p.id,
        inset: p.inset,
        activeTabId: p.activeTabId ?? undefined,
        tabs: p.tabs.map((tid) => ({
          id: tid,
          data: (state.tabs[tid]?.data as TabData) ?? { title: tid },
        })),
      })),
    };
  } catch {
    return defaultLayout;
  }
}

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);

  const handleChange = useCallback((state: TileryLayoutState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
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
          alignItems: 'center',
        }}>
        <span style={{ color: '#9aa1ab' }}>
          Resize panels, then refresh — layout is restored from localStorage.
        </span>
        <button type="button" onClick={reset} style={btnStyle}>
          Reset
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Tilery<TabData>
          ref={tileryRef as React.Ref<TileryHandle>}
          initialLayout={getInitialLayout()}
          onChange={handleChange}
          renderTabHeader={(tab: TileryTabHandle<TabData>) => (
            <span>{tab.data.title}</span>
          )}
          renderTabContent={(tab: TileryTabHandle<TabData>) => (
            <div style={{ padding: 16, color: '#9aa1ab', fontSize: 13 }}>
              {tab.data.title} content
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
