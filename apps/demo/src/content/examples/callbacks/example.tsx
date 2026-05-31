'use client';

import { useCallback, useRef, useState } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryActiveTabChangeEvent,
  TileryHandle,
  TileryInitialLayout,
  TileryTabHandle,
  TileryTabsMoveEvent,
} from '@tilery/react';

type TabData = { title: string; body: string };

type LogEntry = {
  id: number;
  type: string;
  details: string;
};

const layout: TileryInitialLayout<TabData> = {
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

export function Example() {
  const tileryRef = useRef<TileryHandle | null>(null);
  const eventIdRef = useRef(0);
  const tabCounterRef = useRef(0);
  const splitCounterRef = useRef(0);
  const [events, setEvents] = useState<LogEntry[]>([]);

  const log = useCallback((type: string, details: string) => {
    eventIdRef.current += 1;
    const entry = { id: eventIdRef.current, type, details };
    setEvents((current) => [entry, ...current].slice(0, 16));
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
            body: 'Panel splits emit onPanelsOpen, onPanelSplit, and onTabsOpen.',
          },
        },
      ],
    });
  };

  const closeActive = () => {
    const panel = tileryRef.current?.getPanel('editor');
    panel?.activeTab?.remove();
  };

  return (
    <div style={shellStyle}>
      <div style={toolbarStyle}>
        <button type="button" onClick={addTab} style={btnStyle}>
          Add Tab
        </button>
        <button type="button" onClick={activateNext} style={btnStyle}>
          Activate Next
        </button>
        <button type="button" onClick={moveActiveToTerminal} style={btnStyle}>
          Move Active
        </button>
        <button type="button" onClick={splitEditor} style={btnStyle}>
          Split Editor
        </button>
        <button type="button" onClick={closeActive} style={btnStyle}>
          Close Active
        </button>
        <button type="button" onClick={() => setEvents([])} style={btnStyle}>
          Clear Log
        </button>
      </div>
      <div style={bodyStyle}>
        <div style={tileryWrapStyle}>
          <Tilery<TabData>
            ref={tileryRef as React.Ref<TileryHandle>}
            initialLayout={layout}
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
            renderTabHeader={(tab: TileryTabHandle<TabData>) => (
              <span>{tab.data.title}</span>
            )}
            renderTabContent={(tab: TileryTabHandle<TabData>) => (
              <div style={contentStyle}>
                <h2 style={headingStyle}>{tab.data.title}</h2>
                <p style={textStyle}>{tab.data.body}</p>
              </div>
            )}
          />
        </div>
        <aside style={logStyle}>
          <div style={logHeaderStyle}>Event Log</div>
          <div style={logListStyle}>
            {events.length === 0 ? (
              <div style={emptyStyle}>No callback events yet.</div>
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
      </div>
    </div>
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

function tabSummary(tabIds: string[]) {
  return tabIds.length === 0 ? 'none' : tabIds.join(', ');
}

function panelSummary(panelIds: string[]) {
  return panelIds.length === 0 ? 'none' : panelIds.join(', ');
}

const shellStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#0e0f12',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: '8px 12px',
  background: '#16181c',
  borderBottom: '1px solid #2a2d33',
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
};

const tileryWrapStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const logStyle: React.CSSProperties = {
  width: 300,
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid #2a2d33',
  background: '#111318',
};

const logHeaderStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: '#f3f4f7',
  fontSize: 12,
  fontWeight: 600,
  borderBottom: '1px solid #2a2d33',
};

const logListStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 10,
};

const eventStyle: React.CSSProperties = {
  padding: '8px 0',
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

const emptyStyle: React.CSSProperties = {
  color: '#6f7785',
  fontSize: 12,
};

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

const contentStyle: React.CSSProperties = {
  height: '100%',
  padding: 16,
  color: '#9aa1ab',
  fontSize: 13,
  lineHeight: 1.5,
};

const headingStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#f3f4f7',
  fontSize: 14,
};

const textStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: 0,
};
