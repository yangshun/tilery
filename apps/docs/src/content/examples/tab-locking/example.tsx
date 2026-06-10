'use client';

import { Tilery } from '@tileryjs/react';
import type { TileryInitialLayout, TileryTab } from '@tileryjs/react';
import { ExampleSection, ExampleStack, TabContent } from '../example-ui';
import { Button } from '../../../components/ui/button';

type TabData = {
  title: string;
  note?: string;
};

// source-region initial-locks-layout
const initialLocksLayout: TileryInitialLayout<TabData> = {
  type: 'group',
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
            note: 'closable: false',
          },
          closable: false,
        },
      ],
    },
  ],
};
// end-source-region initial-locks-layout

// source-region runtime-behavior-layout
const runtimeLayout: TileryInitialLayout<TabData> = {
  type: 'group',
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
// end-source-region runtime-behavior-layout

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <InitialTabLocksExample />
      <RuntimeTabBehaviorExample />
    </ExampleStack>
  );
}

export function InitialTabLocksExample() {
  return (
    <ExampleSection
      title="Initial tab locks"
      description="Use locked, closable, and draggable on individual tabs.">
      {/* source-region initial-locks-tilery */}
      <Tilery<TabData>
        initialLayout={initialLocksLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderStatusContent}
      />
      {/* end-source-region initial-locks-tilery */}
    </ExampleSection>
  );
}

export function RuntimeTabBehaviorExample() {
  return (
    <ExampleSection
      title="Runtime tab behavior"
      description="Use a tab object to update close and drag behavior while the tab is mounted.">
      {/* source-region runtime-behavior-tilery */}
      <Tilery<TabData>
        initialLayout={runtimeLayout}
        renderTabHeader={renderHeader}
        renderTabContent={(tab) => (
          <TabContent>
            <TabBehaviorControls tab={tab} />
          </TabContent>
        )}
      />
      {/* end-source-region runtime-behavior-tilery */}
    </ExampleSection>
  );
}

function renderHeader(tab: TileryTab<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderStatusContent(tab: TileryTab<TabData>) {
  return (
    <TabContent meta={tab.data.note}>
      <StatusGrid tab={tab} />
    </TabContent>
  );
}

// source-region runtime-behavior-methods
function isTabLocked(tab: TileryTab<TabData>) {
  return !tab.closable && !tab.draggable;
}

function toggleTabLock(tab: TileryTab<TabData>) {
  tab.setBehavior(
    isTabLocked(tab) ? { closable: true, draggable: true } : { locked: true },
  );
}

function toggleTabClosable(tab: TileryTab<TabData>) {
  tab.setBehavior({ closable: !tab.closable });
}

function toggleTabDraggable(tab: TileryTab<TabData>) {
  tab.setBehavior({ draggable: !tab.draggable });
}
// end-source-region runtime-behavior-methods

function TabBehaviorControls({ tab }: { tab: TileryTab<TabData> }) {
  const locked = isTabLocked(tab);

  return (
    <div style={controlsStyle}>
      <Button
        type="button"
        size="compact"
        active={locked}
        onClick={() => toggleTabLock(tab)}>
        {locked ? 'Unlock tab' : 'Lock tab'}
      </Button>
      <Button
        type="button"
        size="compact"
        active={!tab.closable}
        onClick={() => toggleTabClosable(tab)}>
        {tab.closable ? 'Disable close' : 'Enable close'}
      </Button>
      <Button
        type="button"
        size="compact"
        active={!tab.draggable}
        onClick={() => toggleTabDraggable(tab)}>
        {tab.draggable ? 'Disable drag' : 'Enable drag'}
      </Button>
      <StatusGrid tab={tab} />
    </div>
  );
}

function StatusGrid({ tab }: { tab: TileryTab<TabData> }) {
  return (
    <dl style={statusGridStyle}>
      <div>
        <dt style={statusLabelStyle}>closable</dt>
        <dd style={statusValueStyle}>{String(tab.closable)}</dd>
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
  color: 'var(--example-demo-muted-soft)',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

const statusValueStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: 'var(--example-demo-fg)',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};
