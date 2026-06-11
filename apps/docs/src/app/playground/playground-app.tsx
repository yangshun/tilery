'use client';

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
import { Tilery } from '@tileryjs/react';
import { usePointerDrag } from '../../hooks/use-pointer-drag';
import { useEventLog } from '../../hooks/use-event-log';
import type {
  TileryActiveTabChangeEvent,
  TileryController,
  TileryLayoutSnapshot,
  TileryNewTabHandler,
  TileryTab,
  TileryTabInit,
} from '@tileryjs/react';
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
  type PgGlobalProps,
} from './playground-inspector';

export function PlaygroundApp() {
  const controllerRef = useRef<TileryController | null>(null);
  const idRef = useRef(0);
  const seqRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
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
  const [events, log, clearEvents] = useEventLog<{
    type: string;
    detail: string;
  }>(30);

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
      log({
        type: 'activeTab',
        detail: event.changes
          .map(
            (c) =>
              `${c.panelId}: ${c.previousTabId ?? '∅'} → ${c.tabId ?? '∅'}`,
          )
          .join(', '),
      });
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

  const resizeContextRef = useRef<{
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const { startDrag } = usePointerDrag({
    onMove: (e) => {
      const stage = stageRef.current;
      const ctx = resizeContextRef.current;
      if (!stage || !ctx) return;
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const horiz = ctx.direction.includes('e') || ctx.direction.includes('w');
      const vert = ctx.direction.includes('n') || ctx.direction.includes('s');
      const width = horiz
        ? Math.max(360, Math.min(rect.width, 2 * Math.abs(e.clientX - cx)))
        : ctx.initialWidth;
      const height = vert
        ? Math.max(280, Math.min(rect.height, 2 * Math.abs(e.clientY - cy)))
        : ctx.initialHeight;
      setFrameSize({ width: Math.round(width), height: Math.round(height) });
    },
  });

  const startResize = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    ) => {
      event.preventDefault();
      const browser = browserRef.current;
      if (!browser) return;
      const initialRect = browser.getBoundingClientRect();
      resizeContextRef.current = {
        direction,
        initialWidth: initialRect.width,
        initialHeight: initialRect.height,
      };
      startDrag(event.currentTarget, event.pointerId);
    },
    [startDrag],
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
        onClearEvents={clearEvents}
        onResetFrame={() => setFrameSize(null)}
      />
      <div
        className="flex-1 min-w-0 flex items-center justify-center overflow-hidden rounded-2xl max-lg:min-h-0"
        ref={stageRef}>
        <div
          ref={browserRef}
          className="w-[min(980px,100%)] h-[min(660px,100%)] min-w-96 min-h-72 max-w-full max-h-full relative overflow-hidden flex flex-col border border-site-shell-border rounded-xl bg-[var(--tilery-bg,#0e0f12)] bg-clip-padding shadow-2xl max-lg:w-full max-lg:h-full"
          style={frameSize ?? undefined}>
          <div className="shrink-0 h-10 flex items-center gap-2.5 px-3 border-b border-site-shell-border bg-site-shell-bg">
            <span className="inline-flex gap-2 shrink-0">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </span>
            <span className="flex-1 min-w-0 max-w-md mx-auto h-6 flex items-center justify-center gap-1.5 px-3 border border-site-shell-border rounded-lg bg-site-bg text-site-fg/62 font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis">
              {browserUrl}
            </span>
            <span className="w-14 shrink-0" />
          </div>
          <div
            className="playground-workspace flex-1 min-w-0 min-h-0 bg-[var(--tilery-bg,#0e0f12)] [&_.tilery]:h-full [&_.tilery]:text-sm"
            style={themeStyle}>
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
                  log({
                    type: 'panelSplit',
                    detail: `${e.splitPanelId} ${e.direction} → ${e.createdPanelId}`,
                  })
                }
                onTabsMove={(e) =>
                  log({
                    type: 'tabsMove',
                    detail: e.tabs
                      .map((t) => `${t.id} → ${t.panelId}`)
                      .join(', '),
                  })
                }
                onTabsOpen={(e) =>
                  log({
                    type: 'tabsOpen',
                    detail: e.tabs.map((t) => t.id).join(', '),
                  })
                }
                onTabsClose={(e) =>
                  log({
                    type: 'tabsClose',
                    detail: e.tabs.map((t) => t.id).join(', '),
                  })
                }
                onPanelsOpen={(e) =>
                  log({
                    type: 'panelsOpen',
                    detail: e.panels.map((p) => p.id).join(', '),
                  })
                }
                onPanelsClose={(e) =>
                  log({
                    type: 'panelsClose',
                    detail: e.panels.map((p) => p.id).join(', '),
                  })
                }
                renderTabHeader={renderTabHeader}
                renderTabContent={renderTabContent}
              />
            ) : null}
          </div>
          <span
            className="absolute z-10 touch-none top-0 left-0 right-0 h-1.5 cursor-ns-resize"
            onPointerDown={(e) => startResize(e, 'n')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none bottom-0 left-0 right-0 h-1.5 cursor-ns-resize"
            onPointerDown={(e) => startResize(e, 's')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none right-0 top-0 bottom-0 w-1.5 cursor-ew-resize"
            onPointerDown={(e) => startResize(e, 'e')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none left-0 top-0 bottom-0 w-1.5 cursor-ew-resize"
            onPointerDown={(e) => startResize(e, 'w')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none right-0 top-0 w-3.5 h-3.5 cursor-nesw-resize"
            onPointerDown={(e) => startResize(e, 'ne')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none left-0 top-0 w-3.5 h-3.5 cursor-nwse-resize"
            onPointerDown={(e) => startResize(e, 'nw')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none right-0 bottom-0 w-3.5 h-3.5 cursor-nwse-resize"
            onPointerDown={(e) => startResize(e, 'se')}
            aria-hidden="true"
          />
          <span
            className="absolute z-10 touch-none left-0 bottom-0 w-3.5 h-3.5 cursor-nesw-resize"
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
    <span className="inline-flex items-center gap-2">
      <Icon className="text-sm opacity-78" aria-hidden="true" />
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
            : `import { Tilery } from '@tileryjs/react';

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
