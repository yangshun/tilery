'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTabHandle } from '@tilery/react';
import {
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = {
  title: string;
  note?: string;
};

const initialLocksLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'pinned',
      size: 34,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            note: 'locked: true',
          },
          locked: true,
        },
      ],
    },
    {
      type: 'panel',
      id: 'work',
      size: 66,
      tabs: [
        {
          id: 'draft-tab',
          data: {
            title: 'Draft',
            note: 'default behavior',
          },
        },
        {
          id: 'preview-tab',
          data: {
            title: 'Preview',
            note: 'draggable: false',
          },
          draggable: false,
        },
        {
          id: 'terminal-tab',
          data: {
            title: 'Terminal',
            note: 'closeable: false',
          },
          closeable: false,
        },
      ],
    },
  ],
};

const runtimeLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'editor',
      size: 55,
      tabs: [
        {
          id: 'editor-tab',
          data: {
            title: 'Editor',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'preview',
      size: 45,
      tabs: [
        {
          id: 'preview-tab',
          data: {
            title: 'Preview',
          },
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <InitialTabLocksExample />
      <RuntimeTabBehaviorExample />
    </ExampleStack>
  );
}

// source-region initial-locks
export function InitialTabLocksExample() {
  return (
    <ExampleSection
      title="Initial tab locks"
      description="Use locked, closeable, and draggable on individual tabs.">
      <Tilery<TabData>
        initialLayout={initialLocksLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderStatusContent}
      />
    </ExampleSection>
  );
}
// end-source-region initial-locks

// source-region runtime-behavior
export function RuntimeTabBehaviorExample() {
  return (
    <ExampleSection
      title="Runtime tab behavior"
      description="Use a tab handle to update close and drag behavior while the tab is mounted.">
      <Tilery<TabData>
        initialLayout={runtimeLayout}
        renderTabHeader={renderHeader}
        renderTabContent={(tab) => (
          <TabContent>
            <TabBehaviorControls tab={tab} />
          </TabContent>
        )}
      />
    </ExampleSection>
  );
}
// end-source-region runtime-behavior

function renderHeader(tab: TileryTabHandle<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderStatusContent(tab: TileryTabHandle<TabData>) {
  return (
    <TabContent meta={tab.data.note}>
      <StatusGrid tab={tab} />
    </TabContent>
  );
}

function TabBehaviorControls({ tab }: { tab: TileryTabHandle<TabData> }) {
  const locked = !tab.closeable && !tab.draggable;

  return (
    <div style={controlsStyle}>
      <ExampleButton
        type="button"
        active={locked}
        onClick={() =>
          tab.setBehavior(
            locked ? { closeable: true, draggable: true } : { locked: true },
          )
        }>
        {locked ? 'Unlock tab' : 'Lock tab'}
      </ExampleButton>
      <ExampleButton
        type="button"
        active={!tab.closeable}
        onClick={() => tab.setBehavior({ closeable: !tab.closeable })}>
        {tab.closeable ? 'Disable close' : 'Enable close'}
      </ExampleButton>
      <ExampleButton
        type="button"
        active={!tab.draggable}
        onClick={() => tab.setBehavior({ draggable: !tab.draggable })}>
        {tab.draggable ? 'Disable drag' : 'Enable drag'}
      </ExampleButton>
      <StatusGrid tab={tab} />
    </div>
  );
}

function StatusGrid({ tab }: { tab: TileryTabHandle<TabData> }) {
  return (
    <dl style={statusGridStyle}>
      <div>
        <dt style={statusLabelStyle}>closeable</dt>
        <dd style={statusValueStyle}>{String(tab.closeable)}</dd>
      </div>
      <div>
        <dt style={statusLabelStyle}>draggable</dt>
        <dd style={statusValueStyle}>{String(tab.draggable)}</dd>
      </div>
    </dl>
  );
}

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 8,
};

const statusGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(80px, 1fr))',
  gap: 8,
  width: 'min(100%, 240px)',
  margin: 0,
};

const statusLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#6f7785',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

const statusValueStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: '#d9dde3',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};
