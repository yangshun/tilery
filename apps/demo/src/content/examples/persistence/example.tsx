'use client';

import { useRef, useCallback } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryTabHandle,
  TileryHandle,
} from '@tilery/react';

type TabData = { title: string };

const defaultLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'notes', data: { title: 'Notes' } }],
    },
    {
      type: 'panel',
      id: 'right',
      size: 50,
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
    const parsed = JSON.parse(saved) as unknown;
    return isLayoutSnapshot(parsed) ? parsed : defaultLayout;
  } catch {
    return defaultLayout;
  }
}

function isLayoutSnapshot(
  value: unknown,
): value is TileryLayoutSnapshot<TabData> {
  if (!isRecord(value)) return false;
  if (value.type === 'empty') return true;
  if (value.type === 'panel') {
    return (
      isOptionalString(value.id) &&
      isOptionalNumber(value.size) &&
      typeof value.resizable === 'boolean' &&
      typeof value.draggable === 'boolean' &&
      typeof value.droppable === 'boolean' &&
      isOptionalString(value.activeTabId) &&
      isOptionalBoolean(value.fullScreen) &&
      isOptionalSize(value.minSize) &&
      isOptionalSize(value.maxSize) &&
      Array.isArray(value.tabs) &&
      value.tabs.every(isTabSnapshot)
    );
  }
  if (value.type === 'split') {
    return (
      isOptionalString(value.id) &&
      (value.direction === 'horizontal' || value.direction === 'vertical') &&
      isOptionalNumber(value.size) &&
      typeof value.resizable === 'boolean' &&
      typeof value.draggable === 'boolean' &&
      typeof value.droppable === 'boolean' &&
      Array.isArray(value.children) &&
      value.children.every(isLayoutSnapshot)
    );
  }
  return false;
}

function isTabSnapshot(value: unknown) {
  return (
    isRecord(value) &&
    isOptionalString(value.id) &&
    typeof value.closeable === 'boolean' &&
    typeof value.draggable === 'boolean' &&
    isTabData(value.data)
  );
}

function isTabData(value: unknown): value is TabData {
  return isRecord(value) && typeof value.title === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalNumber(value: unknown) {
  return value === undefined || typeof value === 'number';
}

function isOptionalSize(value: unknown) {
  return (
    value === undefined ||
    typeof value === 'number' ||
    (typeof value === 'string' && /^-?(?:\d+|\d*\.\d+)\s*(%|px)$/.test(value))
  );
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean';
}

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);

  const handleChange = useCallback(() => {
    const layout = tileryRef.current?.getLayout<TabData>();
    if (!layout) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
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
