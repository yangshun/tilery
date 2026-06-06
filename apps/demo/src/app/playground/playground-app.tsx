'use client';

// Playground orchestrator. Owns the live Tilery instance plus the inspector's
// state: the current snapshot (refreshed on every onChange so the inspector
// mirrors the workspace), the selected panel/tab, global component props, theme,
// id/sequence counters, and the lifecycle event log. Structural commands are
// issued by the inspector through the shared controller ref.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryActiveTabChangeEvent,
  TileryController,
  TileryLayoutSnapshot,
  TileryNewTabHandler,
  TileryTab,
  TileryTabInit,
} from '@tilery/react';
import type { IconType } from 'react-icons';
import {
  RiCodeSLine,
  RiFileTextLine,
  RiFolder3Line,
  RiLayoutLine,
  RiPulseLine,
  RiTerminalBoxLine,
} from 'react-icons/ri';
import {
  PG_DEFAULT_LAYOUT,
  PG_KIND_LABEL,
  PG_TAB_KINDS,
  PG_THEMES,
  collectPanels,
  type PgTabData,
  type PgTabKind,
} from './playground-data';
import {
  PlaygroundInspector,
  type PgEvent,
  type PgGlobalProps,
} from './playground-inspector';

export function PlaygroundApp() {
  const controllerRef = useRef<TileryController | null>(null);
  const idRef = useRef(0);
  const seqRef = useRef(0);
  const eventIdRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [snapshot, setSnapshot] =
    useState<TileryLayoutSnapshot<PgTabData> | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [global, setGlobal] = useState<PgGlobalProps>({
    resizable: true,
    showActionsButton: true,
    showNewTabButton: false,
    resizeHandleHitSize: 24,
    minSize: 10,
  });
  const [themeId, setThemeId] = useState('default');
  const [events, setEvents] = useState<PgEvent[]>([]);

  const uid = useCallback((prefix: string) => {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }, []);

  const makeTab = useCallback((): TileryTabInit<PgTabData> => {
    seqRef.current += 1;
    const kind = PG_TAB_KINDS[seqRef.current % PG_TAB_KINDS.length];
    return {
      id: uid('tab'),
      data: { title: `${PG_KIND_LABEL[kind]} ${seqRef.current}`, kind },
    };
  }, [uid]);

  const refresh = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) setSnapshot(controller.getLayout<PgTabData>());
  }, []);

  const log = useCallback((type: string, detail: string) => {
    eventIdRef.current += 1;
    // Capture the id here: when several callbacks fire for one action, the
    // setEvents updaters are batched and would all read the final ref value,
    // producing duplicate ids (and duplicate React keys).
    const id = eventIdRef.current;
    setEvents((current) => [{ id, type, detail }, ...current].slice(0, 30));
  }, []);

  useEffect(() => {
    setMounted(true);
    setBrowserUrl(window.location.host + window.location.pathname);
  }, []);
  useEffect(() => {
    if (mounted) refresh();
  }, [mounted, refresh]);

  const panels = useMemo(
    () => (snapshot ? collectPanels(snapshot) : []),
    [snapshot],
  );

  // Keep the selected panel/tab valid as the workspace changes.
  useEffect(() => {
    setSelectedPanelId((current) => {
      if (panels.length === 0) return null;
      return current && panels.some((p) => p.id === current)
        ? current
        : panels[0].id;
    });
  }, [panels]);
  useEffect(() => {
    const panel = panels.find((p) => p.id === selectedPanelId);
    setSelectedTabId((current) => {
      if (!panel) return null;
      return current && panel.tabs.some((t) => t.id === current)
        ? current
        : (panel.tabs[0]?.id ?? null);
    });
  }, [panels, selectedPanelId]);

  const onActiveTabChange = useCallback(
    (event: TileryActiveTabChangeEvent) => {
      const change = event.changes.find((c) => c.tabId) ?? event.changes[0];
      if (change?.tabId) {
        setSelectedPanelId(change.panelId);
        setSelectedTabId(change.tabId);
      }
      log(
        'activeTab',
        event.changes
          .map(
            (c) =>
              `${c.panelId}: ${c.previousTabId ?? '∅'} → ${c.tabId ?? '∅'}`,
          )
          .join(', '),
      );
      refresh();
    },
    [log, refresh],
  );

  const handleNewTab = useCallback<TileryNewTabHandler<PgTabData>>(
    () => makeTab(),
    [makeTab],
  );

  const themeStyle = useMemo<CSSProperties>(
    () => PG_THEMES.find((t) => t.id === themeId)?.style ?? {},
    [themeId],
  );

  // Resize the browser frame symmetrically about the stage centre.
  const startResize = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    ) => {
      event.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const browser = stage.querySelector<HTMLElement>('.playground-browser');
      if (!browser) return;
      const initialRect = browser.getBoundingClientRect();
      const initialWidth = initialRect.width;
      const initialHeight = initialRect.height;
      const handle = event.currentTarget;
      const { pointerId } = event;
      try {
        handle.setPointerCapture(pointerId);
      } catch {
        /* pointer no longer active */
      }
      const onMove = (e: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const horiz = direction.includes('e') || direction.includes('w');
        const vert = direction.includes('n') || direction.includes('s');
        const width = horiz
          ? Math.max(360, Math.min(rect.width, 2 * Math.abs(e.clientX - cx)))
          : initialWidth;
        const height = vert
          ? Math.max(280, Math.min(rect.height, 2 * Math.abs(e.clientY - cy)))
          : initialHeight;
        setFrameSize({ width: Math.round(width), height: Math.round(height) });
      };
      const onUp = () => {
        try {
          handle.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    },
    [],
  );

  return (
    <>
      <PlaygroundInspector
        controllerRef={controllerRef}
        panels={panels}
        selectedPanelId={selectedPanelId}
        selectedTabId={selectedTabId}
        onSelectPanel={setSelectedPanelId}
        onSelectTab={setSelectedTabId}
        uid={uid}
        makeTab={makeTab}
        global={global}
        onGlobalChange={(patch) => setGlobal((g) => ({ ...g, ...patch }))}
        themeId={themeId}
        onThemeChange={setThemeId}
        events={events}
        onClearEvents={() => setEvents([])}
        onResetFrame={() => setFrameSize(null)}
      />
      <div className="playground-stage" ref={stageRef}>
        <div className="playground-browser" style={frameSize ?? undefined}>
          <div className="playground-browser__bar">
            <span className="playground-browser__lights">
              <span className="playground-browser__light playground-browser__light--red" />
              <span className="playground-browser__light playground-browser__light--yellow" />
              <span className="playground-browser__light playground-browser__light--green" />
            </span>
            <span className="playground-browser__address">{browserUrl}</span>
            <span className="playground-browser__bar-spacer" />
          </div>
          <div className="playground-workspace" style={themeStyle}>
            {mounted ? (
              <Tilery<PgTabData>
                ref={controllerRef as Ref<TileryController>}
                initialLayout={PG_DEFAULT_LAYOUT}
                resizable={global.resizable}
                minSize={global.minSize}
                resizeHandleHitSize={global.resizeHandleHitSize}
                showActionsButton={global.showActionsButton}
                showNewTabButton={global.showNewTabButton}
                onNewTab={handleNewTab}
                onChange={refresh}
                onActiveTabChange={onActiveTabChange}
                onPanelSplit={(e) =>
                  log(
                    'panelSplit',
                    `${e.splitPanelId} ${e.direction} → ${e.createdPanelId}`,
                  )
                }
                onTabsMove={(e) =>
                  log(
                    'tabsMove',
                    e.tabs.map((t) => `${t.id} → ${t.panelId}`).join(', '),
                  )
                }
                onTabsOpen={(e) =>
                  log('tabsOpen', e.tabs.map((t) => t.id).join(', '))
                }
                onTabsClose={(e) =>
                  log('tabsClose', e.tabs.map((t) => t.id).join(', '))
                }
                onPanelsOpen={(e) =>
                  log('panelsOpen', e.panels.map((p) => p.id).join(', '))
                }
                onPanelsClose={(e) =>
                  log('panelsClose', e.panels.map((p) => p.id).join(', '))
                }
                renderTabHeader={renderTabHeader}
                renderTabContent={renderTabContent}
              />
            ) : null}
          </div>
          <span
            className="playground-browser__resize playground-browser__resize--n"
            onPointerDown={(e) => startResize(e, 'n')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--s"
            onPointerDown={(e) => startResize(e, 's')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--e"
            onPointerDown={(e) => startResize(e, 'e')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--w"
            onPointerDown={(e) => startResize(e, 'w')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--ne"
            onPointerDown={(e) => startResize(e, 'ne')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--nw"
            onPointerDown={(e) => startResize(e, 'nw')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--se"
            onPointerDown={(e) => startResize(e, 'se')}
            aria-hidden="true"
          />
          <span
            className="playground-browser__resize playground-browser__resize--sw"
            onPointerDown={(e) => startResize(e, 'sw')}
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  );
}

const KIND_ICON: Record<PgTabKind, IconType> = {
  editor: RiCodeSLine,
  terminal: RiTerminalBoxLine,
  files: RiFolder3Line,
  preview: RiLayoutLine,
  notes: RiFileTextLine,
  output: RiPulseLine,
};

function renderTabHeader(tab: TileryTab<PgTabData>) {
  const Icon = KIND_ICON[tab.data.kind];
  return (
    <span className="playground-tab">
      <Icon className="playground-tab__icon" aria-hidden="true" />
      <span>{tab.data.title}</span>
    </span>
  );
}

function renderTabContent(tab: TileryTab<PgTabData>) {
  return <div style={contentStyle}>{tabSample(tab.data)}</div>;
}

const contentStyle: CSSProperties = {
  height: '100%',
  padding: 16,
  overflow: 'auto',
  color: 'var(--tilery-tab-fg, #9aa1ab)',
  fontSize: 14,
  lineHeight: 1.5,
};

// Reset the demo's global <pre> styling (border, radius, padding) so the code
// samples read as plain preformatted text rather than a boxed code block.
const mono: CSSProperties = {
  margin: 0,
  padding: 0,
  border: 0,
  borderRadius: 0,
  background: 'none',
  color: 'inherit',
  fontFamily: 'var(--site-mono)',
  fontSize: 12.5,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
};

function tabSample({ kind, title }: PgTabData) {
  switch (kind) {
    case 'editor':
      return (
        <pre style={mono}>
          {/\.css$/i.test(title)
            ? `.workspace {
  display: grid;
  height: 100%;
  background: #0e0f12;
}

.panel {
  border-radius: 6px;
  border: 1px solid #2a2d33;
}

.panel[data-active='true'] {
  color: #f3f4f7;
}`
            : `import { Tilery } from '@tilery/react';

export function App() {
  return <Tilery initialLayout={layout} />;
}`}
        </pre>
      );
    case 'terminal':
      return (
        <pre style={mono}>
          {'$ pnpm dev\nready in 312ms\n› local http://localhost:3000'}
        </pre>
      );
    case 'output':
      return (
        <pre style={mono}>
          {'[info] build started\n[info] compiled 42 modules\n[done] no errors'}
        </pre>
      );
    case 'files':
      return (
        <pre style={mono}>
          {'src/\n  app/\n  components/\n  index.ts\npackage.json'}
        </pre>
      );
    case 'preview':
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              width: 90,
              height: 10,
              borderRadius: 999,
              background: 'var(--tilery-accent, #3884ff)',
            }}
          />
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 999,
              background: 'currentColor',
              opacity: 0.25,
            }}
          />
          <div
            style={{
              width: '70%',
              height: 8,
              borderRadius: 999,
              background: 'currentColor',
              opacity: 0.25,
            }}
          />
        </div>
      );
    case 'notes':
    default:
      return (
        <p style={{ margin: 0 }}>
          {title} — a draggable, splittable surface. Use the inspector to lock,
          float, pop out, or rearrange this panel.
        </p>
      );
  }
}
