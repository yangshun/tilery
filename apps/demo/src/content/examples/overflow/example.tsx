'use client';

import { useMemo, useRef, useState } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryTab,
} from '@tilery/react';
import { ExampleButton, ExampleSection, TabContent } from '../example-ui';

type TabData = {
  title: string;
  section: string;
};

const tabs = Array.from({ length: 16 }, (_, index) => {
  const n = index + 1;
  return {
    id: `file-${n}`,
    data: {
      title: `src/workspaces/overflow-example-${n}.tsx`,
      section: n <= 6 ? 'Editor' : n <= 11 ? 'Review' : 'Generated',
    },
  };
});

const layout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 28,
      tabs: [
        {
          id: 'tree',
          closable: false,
          data: { title: 'Navigator', section: 'Project' },
        },
      ],
    },
    {
      type: 'panel',
      id: 'editor',
      size: 72,
      activeTabId: 'file-1',
      tabs,
    },
  ],
};

export function Example() {
  return <TabOverflowExample />;
}

// source-region tab-overflow
export function TabOverflowExample() {
  const tileryRef = useRef<TileryController | null>(null);
  const [activeId, setActiveId] = useState('file-1');
  const jumpTargets = useMemo(
    () => [
      { label: 'First', tabId: 'file-1' },
      { label: 'Middle', tabId: 'file-8' },
      { label: 'Last', tabId: 'file-16' },
    ],
    [],
  );

  return (
    <ExampleSection
      title="Overflowing editor tabs"
      description="Use the mouse wheel, hidden-tab menu, or jump buttons; the active tab is kept visible in the row."
      actions={jumpTargets.map((target) => (
        <ExampleButton
          key={target.tabId}
          active={activeId === target.tabId}
          onClick={() => tileryRef.current?.setActiveTab(target.tabId)}>
          {target.label}
        </ExampleButton>
      ))}>
      <Tilery<TabData>
        ref={tileryRef}
        initialLayout={layout}
        onActiveTabChange={(event) => {
          const editorChange = event.changes.find(
            (change) => change.panelId === 'editor',
          );
          if (editorChange?.tabId) setActiveId(editorChange.tabId);
        }}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent meta={tab.data.section}>
            <p style={{ margin: 0 }}>
              {tab.id === 'tree'
                ? 'The adjacent editor panel contains enough tabs to overflow the tab row.'
                : `${tab.data.title} stays reachable even when the tab strip is narrower than the full tab set.`}
            </p>
          </TabContent>
        )}
      />
    </ExampleSection>
  );
}
// end-source-region tab-overflow
