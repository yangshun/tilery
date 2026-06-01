'use client';

import { useCallback, useRef, useState } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryActiveTabChangeEvent,
  TileryHandle,
  TileryInitialLayout,
  TileryResizeEvent,
  TileryTabHandle,
  TileryTabsMoveEvent,
} from '@tilery/react';
import {
  EmptyState,
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = { title: string; body: string };

type LogEntry = {
  id: number;
  type: string;
  details: string;
};

const structuralLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'editor',
      size: 62,
      tabs: [
        {
          id: 'main',
          data: {
            title: 'main.ts',
            body: 'Use the toolbar to trigger lifecycle callbacks.',
          },
        },
        {
          id: 'router',
          data: {
            title: 'router.ts',
            body: 'Activating, moving, splitting, and closing tabs updates the event stream.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'terminal',
      size: 38,
      tabs: [
        {
          id: 'console',
          data: {
            title: 'Console',
            body: 'Moved tabs can land here.',
          },
        },
      ],
    },
  ],
};

const resizeLayout: TileryInitialLayout<TabData> = {
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'navigator',
      size: 32,
      tabs: [
        {
          id: 'navigator-tab',
          data: {
            title: 'Navigator',
            body: 'Drag the divider to emit resize events.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'workspace',
      size: 68,
      tabs: [
        {
          id: 'workspace-tab',
          data: {
            title: 'Workspace',
            body: 'Resize callbacks report affected panels and sizes.',
          },
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1.15fr) minmax(0, 0.85fr)">
      <StructuralCallbacksExample />
      <ResizeCallbacksExample />
    </ExampleStack>
  );
}

// source-region structural
export function StructuralCallbacksExample() {
  const tileryRef = useRef<TileryHandle | null>(null);
  const eventIdRef = useRef(0);
  const tabCounterRef = useRef(0);
  const splitCounterRef = useRef(0);
  const [events, setEvents] = useState<LogEntry[]>([]);

  const log = useCallback((type: string, details: string) => {
    eventIdRef.current += 1;
    setEvents((current) =>
      [{ id: eventIdRef.current, type, details }, ...current].slice(0, 8),
    );
  }, []);

  const addTab = () => {
    const panel = tileryRef.current?.getPanel('editor');
    if (!panel) return;
    tabCounterRef.current += 1;
    panel.appendTab({
      id: `draft-${tabCounterRef.current}`,
      data: {
        title: `draft-${tabCounterRef.current}.ts`,
        body: 'New tabs fire onTabsOpen and usually onActiveTabChange.',
      },
    });
  };

  const activateNext = () => {
    const panel = tileryRef.current?.getPanel('editor');
    if (!panel || panel.tabs.length === 0) return;
    const activeIndex = panel.tabs.findIndex(
      (tab) => tab.id === panel.activeTab?.id,
    );
    const next = panel.tabs[(activeIndex + 1) % panel.tabs.length];
    if (next) panel.setActiveTab(next.id);
  };

  const moveActiveToTerminal = () => {
    const editor = tileryRef.current?.getPanel('editor');
    const terminal = tileryRef.current?.getPanel('terminal');
    const active = editor?.activeTab;
    if (!active || !terminal) return;
    active.moveTo({ panel: terminal.id, index: terminal.tabs.length });
  };

  const splitEditor = () => {
    const panel = tileryRef.current?.getPanel('editor');
    if (!panel) return;
    splitCounterRef.current += 1;
    panel.split('right', {
      size: 42,
      tabs: [
        {
          id: `split-${splitCounterRef.current}`,
          data: {
            title: `split-${splitCounterRef.current}.ts`,
            body: 'Panel splits emit open and split callbacks.',
          },
        },
      ],
    });
  };

  const closeActive = () => {
    tileryRef.current?.getPanel('editor')?.activeTab?.remove();
  };

  return (
    <ExampleSection
      title="Structural callbacks"
      description="Append, activate, move, split, and close tabs while watching the emitted events."
      actions={
        <>
          <ExampleButton type="button" onClick={addTab}>
            Add Tab
          </ExampleButton>
          <ExampleButton type="button" onClick={activateNext}>
            Activate Next
          </ExampleButton>
          <ExampleButton type="button" onClick={moveActiveToTerminal}>
            Move Active
          </ExampleButton>
          <ExampleButton type="button" onClick={splitEditor}>
            Split Editor
          </ExampleButton>
          <ExampleButton type="button" onClick={closeActive}>
            Close Active
          </ExampleButton>
          <ExampleButton type="button" onClick={() => setEvents([])}>
            Clear
          </ExampleButton>
        </>
      }>
      <div style={demoWithLogStyle}>
        <div style={tileryWrapStyle}>
          <Tilery<TabData>
            ref={tileryRef as React.Ref<TileryHandle>}
            initialLayout={structuralLayout}
            onActiveTabChange={(event) =>
              log('onActiveTabChange', activeSummary(event))
            }
            onTabsMove={(event) => log('onTabsMove', moveSummary(event))}
            onPanelsOpen={(event) =>
              log('onPanelsOpen', panelSummary(event.panels.map((p) => p.id)))
            }
            onPanelSplit={(event) =>
              log(
                'onPanelSplit',
                `${event.splitPanelId} ${event.direction} -> ${event.createdPanelId}`,
              )
            }
            onTabsOpen={(event) =>
              log('onTabsOpen', tabSummary(event.tabs.map((tab) => tab.id)))
            }
            onTabsClose={(event) =>
              log('onTabsClose', tabSummary(event.tabs.map((tab) => tab.id)))
            }
            onPanelsClose={(event) =>
              log(
                'onPanelsClose',
                panelSummary(event.panels.map((panel) => panel.id)),
              )
            }
            renderTabHeader={renderHeader}
            renderTabContent={renderContent}
          />
        </div>
        <EventLog title="Events" events={events} />
      </div>
    </ExampleSection>
  );
}
// end-source-region structural

// source-region resize
export function ResizeCallbacksExample() {
  const eventIdRef = useRef(0);
  const [events, setEvents] = useState<LogEntry[]>([]);

  const logResize = useCallback((type: string, event: TileryResizeEvent) => {
    eventIdRef.current += 1;
    setEvents((current) =>
      [
        {
          id: eventIdRef.current,
          type,
          details: resizeSummary(event),
        },
        ...current,
      ].slice(0, 6),
    );
  }, []);

  return (
    <ExampleSection
      title="Resize callbacks"
      description="Drag the divider to compare continuous onResize events with the committed onResizeEnd event."
      actions={
        <ExampleButton type="button" onClick={() => setEvents([])}>
          Clear
        </ExampleButton>
      }>
      <div style={demoWithLogStyle}>
        <div style={tileryWrapStyle}>
          <Tilery<TabData>
            initialLayout={resizeLayout}
            onResize={(event) => logResize('onResize', event)}
            onResizeEnd={(event) => logResize('onResizeEnd', event)}
            renderTabHeader={renderHeader}
            renderTabContent={renderContent}
          />
        </div>
        <EventLog title="Resize Events" events={events} />
      </div>
    </ExampleSection>
  );
}
// end-source-region resize

function EventLog({ title, events }: { title: string; events: LogEntry[] }) {
  return (
    <aside style={logStyle}>
      <div style={logHeaderStyle}>{title}</div>
      <div style={logListStyle}>
        {events.length === 0 ? (
          <EmptyState>No callback events yet.</EmptyState>
        ) : (
          events.map((event) => (
            <div key={event.id} style={eventStyle}>
              <div style={eventTypeStyle}>{event.type}</div>
              <div style={eventDetailsStyle}>{event.details}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function renderHeader(tab: TileryTabHandle<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTabHandle<TabData>) {
  return (
    <TabContent>
      <p style={{ margin: 0 }}>{tab.data.body}</p>
    </TabContent>
  );
}

function activeSummary(event: TileryActiveTabChangeEvent) {
  return event.changes
    .map(
      (change) =>
        `${change.panelId}: ${change.previousTabId ?? 'none'} -> ${
          change.tabId ?? 'none'
        }`,
    )
    .join(', ');
}

function moveSummary(event: TileryTabsMoveEvent<TabData>) {
  return event.tabs
    .map(
      (tab) =>
        `${tab.id}: ${tab.previousPanelId}[${tab.previousIndex}] -> ${tab.panelId}[${tab.index}]`,
    )
    .join(', ');
}

function resizeSummary(event: TileryResizeEvent) {
  const source =
    event.source.type === 'divider'
      ? `${event.source.orientation} divider`
      : 'junction';
  const changes = event.changes
    .map(
      (change) =>
        `${change.panelId} ${change.dimension} ${round(change.previousSize)} -> ${round(change.size)}`,
    )
    .join(', ');

  return `${event.input} ${source}: ${changes}`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function tabSummary(tabIds: string[]) {
  return tabIds.length === 0 ? 'none' : tabIds.join(', ');
}

function panelSummary(panelIds: string[]) {
  return panelIds.length === 0 ? 'none' : panelIds.join(', ');
}

const demoWithLogStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'flex',
};

const tileryWrapStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const logStyle: React.CSSProperties = {
  width: 260,
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid #2a2d33',
  background: '#111318',
};

const logHeaderStyle: React.CSSProperties = {
  padding: '9px 10px',
  color: '#f3f4f7',
  fontSize: 12,
  fontWeight: 650,
  borderBottom: '1px solid #2a2d33',
};

const logListStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 10,
};

const eventStyle: React.CSSProperties = {
  padding: '7px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const eventTypeStyle: React.CSSProperties = {
  color: '#f3f4f7',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

const eventDetailsStyle: React.CSSProperties = {
  marginTop: 3,
  color: '#9aa1ab',
  fontSize: 12,
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
};
