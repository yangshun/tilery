'use client';

import { useCallback, useRef, useState } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryLayoutSnapshot,
  TileryTab,
} from '@tilery/react';
import {
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = { title: string; body: string };

const defaultLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'notes',
      size: 50,
      tabs: [
        {
          id: 'notes-tab',
          data: {
            title: 'Notes',
            body: 'Resize panels, then refresh to restore this layout from localStorage.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'preview',
      size: 50,
      tabs: [
        {
          id: 'preview-tab',
          data: {
            title: 'Preview',
            body: 'Snapshots preserve panel sizes, tabs, behavior flags, and active tab state.',
          },
        },
      ],
    },
  ],
};

const snapshotLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 34,
      tabs: [
        {
          id: 'inbox',
          data: {
            title: 'Inbox',
            body: 'Save a snapshot, mutate the layout, then restore the saved tree.',
          },
          closable: false,
        },
      ],
    },
    {
      type: 'panel',
      id: 'right',
      size: 66,
      tabs: [
        {
          id: 'details',
          data: {
            title: 'Details',
            body: 'setLayout(snapshot) replaces the current layout explicitly.',
          },
        },
      ],
    },
  ],
};

const STORAGE_KEY = 'tilery-example-persistence';

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <LocalStorageExample />
      <SnapshotControlsExample />
    </ExampleStack>
  );
}

// source-region local-storage
export function LocalStorageExample() {
  const tileryRef = useRef<TileryController | null>(null);
  const initialLayoutRef = useRef(getInitialLayout());

  const handleChange = useCallback(() => {
    const layout = tileryRef.current?.getLayout<TabData>();
    if (!layout) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, []);

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    tileryRef.current?.setLayout(defaultLayout);
  };

  return (
    <ExampleSection
      title="localStorage restore"
      description="Persist every layout change as a snapshot and use it as the next initialLayout."
      actions={
        <ExampleButton type="button" onClick={reset}>
          Reset
        </ExampleButton>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={initialLayoutRef.current}
        onChange={handleChange}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region local-storage

// source-region snapshot-controls
export function SnapshotControlsExample() {
  const tileryRef = useRef<TileryController | null>(null);
  const [snapshot, setSnapshot] =
    useState<TileryLayoutSnapshot<TabData> | null>(null);

  const saveSnapshot = () => {
    setSnapshot(tileryRef.current?.getLayout<TabData>() ?? null);
  };

  const restoreSnapshot = () => {
    if (snapshot) tileryRef.current?.setLayout(snapshot);
  };

  const resetLayout = () => {
    tileryRef.current?.setLayout(snapshotLayout);
  };

  return (
    <ExampleSection
      title="Snapshot controls"
      description={
        snapshot
          ? 'A snapshot is saved in React state and can be restored.'
          : 'Save the current layout before moving tabs or resizing panels.'
      }
      actions={
        <>
          <ExampleButton type="button" onClick={saveSnapshot}>
            Save
          </ExampleButton>
          <ExampleButton
            type="button"
            onClick={restoreSnapshot}
            disabled={!snapshot}
            style={!snapshot ? disabledButtonStyle : undefined}>
            Restore
          </ExampleButton>
          <ExampleButton type="button" onClick={resetLayout}>
            Reset
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={snapshotLayout}
        showActionsButton={true}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region snapshot-controls

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

function renderHeader(tab: TileryTab<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTab<TabData>) {
  return (
    <TabContent>
      <p style={{ margin: 0 }}>{tab.data.body}</p>
    </TabContent>
  );
}

function isLayoutSnapshot(
  value: unknown,
): value is TileryLayoutSnapshot<TabData> {
  if (!isRecord(value)) return false;
  if (value.type === 'empty') return true;
  if (value.type === 'panel') {
    return (
      isOptionalString(value.id) &&
      isOptionalSize(value.size) &&
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
  if (value.type === 'group') {
    return (
      isOptionalString(value.id) &&
      (value.direction === 'horizontal' || value.direction === 'vertical') &&
      isOptionalSize(value.size) &&
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
    typeof value.closable === 'boolean' &&
    typeof value.draggable === 'boolean' &&
    isTabData(value.data)
  );
}

function isTabData(value: unknown): value is TabData {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
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

const disabledButtonStyle: React.CSSProperties = {
  color: '#6f7785',
  cursor: 'not-allowed',
};
