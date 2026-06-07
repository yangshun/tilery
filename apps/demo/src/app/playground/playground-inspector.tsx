'use client';

// The Playground inspector: a scrollable controls sidebar driven entirely by the
// live snapshot (passed in as `panels`). Display state is read from the snapshot
// entries; commands are issued through the live controller handle. Panel behavior
// (resize/drag/drop, min/max) has no runtime setter, so those toggles round-trip
// through getLayout() -> patchPanelInSnapshot() -> setLayout().

import { useEffect, useState, type RefObject } from 'react';
import Link from 'next/link';
import { AppearanceFooter } from '../../components/appearance-footer';
import type {
  TileryController,
  TileryDirection,
  TileryTabBehaviorUpdate,
  TileryTabInit,
} from '@tilery/react';
import {
  PG_DEFAULT_LAYOUT,
  PG_PRESETS,
  PG_THEMES,
  patchPanelInSnapshot,
  type PgPanelEntry,
  type PgPanelPatch,
  type PgTabData,
} from './playground-data';
import {
  Button,
  ButtonGroup,
  Field,
  NumberInput,
  Select,
  SwitchInput,
  AccordionItem,
  AccordionRoot,
  Input,
} from '../../components/ui';

export type PgGlobalProps = {
  resizable: boolean;
  showActionsButton: boolean;
  showNewTabButton: boolean;
  resizeHandleHitSize: number;
  minSize: number;
};

export type PgEvent = { id: number; type: string; detail: string };

const STORAGE_KEY = 'tilery-playground-layout';

const DIRECTIONS: Array<{ value: TileryDirection; label: string }> = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'bottom', label: 'Down' },
  { value: 'top', label: 'Up' },
];

type Props = {
  controllerRef: RefObject<TileryController | null>;
  panels: PgPanelEntry[];
  selectedPanelId: string | null;
  selectedTabId: string | null;
  onSelectPanel: (id: string) => void;
  onSelectTab: (id: string) => void;
  uid: (prefix: string) => string;
  makeTab: () => TileryTabInit<PgTabData>;
  global: PgGlobalProps;
  onGlobalChange: (patch: Partial<PgGlobalProps>) => void;
  themeId: string;
  onThemeChange: (id: string) => void;
  events: PgEvent[];
  onClearEvents: () => void;
  onResetFrame: () => void;
};

export function PlaygroundInspector({
  controllerRef,
  panels,
  selectedPanelId,
  selectedTabId,
  onSelectPanel,
  onSelectTab,
  uid,
  makeTab,
  global,
  onGlobalChange,
  themeId,
  onThemeChange,
  events,
  onClearEvents,
  onResetFrame,
}: Props) {
  const [splitDir, setSplitDir] = useState<TileryDirection>('right');
  const [copied, setCopied] = useState(false);
  // Start false on both server and client to avoid a hydration mismatch, then
  // reconcile with localStorage after mount.
  const [hasSaved, setHasSaved] = useState(false);
  useEffect(() => {
    setHasSaved(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  const tilery = () => controllerRef.current;

  const panel = panels.find((p) => p.id === selectedPanelId) ?? null;
  const tab = panel?.tabs.find((t) => t.id === selectedTabId) ?? null;

  const panelOptions = panels.map((p) => ({
    value: p.id,
    label: `${p.tabs[0]?.title ?? p.id} · ${p.kindLabel}`,
  }));
  const tabOptions = (panel?.tabs ?? []).map((t) => ({
    value: t.id,
    label: t.title,
  }));
  const moveTargets = panels
    .filter((p) => p.id !== selectedPanelId)
    .map((p) => ({ value: p.id, label: `${p.tabs[0]?.title ?? p.id}` }));

  // ---- panel behavior round-trip ----
  const patchPanel = (patch: PgPanelPatch) => {
    const t = tilery();
    if (!t || !selectedPanelId) return;
    const snap = t.getLayout<PgTabData>();
    if (patchPanelInSnapshot(snap, selectedPanelId, patch)) t.setLayout(snap);
  };

  // ---- workspace ops ----
  const addTab = () => {
    if (!selectedPanelId) return;
    tilery()
      ?.getPanel(selectedPanelId)
      ?.appendTab(makeTab(), { activate: true });
  };
  const splitPanel = () => {
    if (!selectedPanelId) return;
    // No explicit `size`: Tilery splits the slot evenly, which always fits.
    // A fixed size can exceed a narrow panel's slot and be rejected silently.
    tilery()
      ?.getPanel(selectedPanelId)
      ?.split(splitDir, { tabs: [makeTab()] });
  };
  const removePanel = () => {
    if (!selectedPanelId) return;
    tilery()?.getPanel(selectedPanelId)?.remove();
  };
  const reset = () => {
    tilery()?.setLayout(PG_DEFAULT_LAYOUT);
    onResetFrame();
  };
  const loadPreset = (id: string) => {
    const preset = PG_PRESETS.find((p) => p.id === id);
    if (preset) tilery()?.setLayout(preset.layout);
  };
  const saveLayout = () => {
    const layout = tilery()?.getLayout();
    if (!layout) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    setHasSaved(true);
  };
  const restoreLayout = () => {
    const raw =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return;
    try {
      tilery()?.setLayout(JSON.parse(raw));
    } catch {
      /* ignore malformed snapshot */
    }
  };
  const exportLayout = () => {
    const layout = tilery()?.getLayout();
    if (!layout) return;
    void navigator.clipboard?.writeText(JSON.stringify(layout, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  // ---- panel actions ----
  const toggleMaximize = () => {
    if (!selectedPanelId) return;
    const p = tilery()?.getPanel(selectedPanelId);
    if (!p) return;
    if (panel?.fullScreen) p.restore();
    else p.maximize();
  };
  const toggleFloat = () => {
    if (!selectedPanelId) return;
    const p = tilery()?.getPanel(selectedPanelId);
    if (!p) return;
    if (panel?.container === 'floating') p.dock();
    else p.float({ x: 18, y: 18, width: 44, height: 50 });
  };
  const togglePopout = () => {
    if (!selectedPanelId) return;
    const p = tilery()?.getPanel(selectedPanelId);
    if (!p) return;
    if (panel?.poppedOut) p.returnToFloating();
    else
      p.popout({
        floatingBounds: { x: 16, y: 16, width: 46, height: 54 },
        windowBounds: { left: 120, top: 90, width: 760, height: 540 },
      });
  };
  const focusPanel = () => {
    if (selectedPanelId) tilery()?.getPanel(selectedPanelId)?.focus();
  };

  // ---- tab actions ----
  const tabLocked = tab ? !tab.closable && !tab.draggable : false;
  const setTabBehavior = (next: TileryTabBehaviorUpdate) => {
    if (selectedTabId) tilery()?.getTab(selectedTabId)?.setBehavior(next);
  };
  const renameTab = (title: string) => {
    if (selectedTabId && tab) {
      tilery()?.getTab(selectedTabId)?.setData({ title, kind: tab.kind });
    }
  };
  const moveTab = (targetPanelId: string) => {
    if (!selectedTabId || !targetPanelId) return;
    const target = panels.find((p) => p.id === targetPanelId);
    if (!target) return;
    tilery()
      ?.getTab(selectedTabId)
      ?.moveTo({ panel: targetPanelId, index: target.tabs.length });
  };
  const floatTab = () => {
    if (selectedTabId)
      tilery()
        ?.getTab(selectedTabId)
        ?.float({
          panelId: uid('float'),
          bounds: { x: 20, y: 18, width: 38, height: 46 },
        });
  };
  const popoutTab = () => {
    if (selectedTabId)
      tilery()
        ?.getTab(selectedTabId)
        ?.popout({
          panelId: uid('popout'),
          floatingBounds: { x: 20, y: 18, width: 38, height: 46 },
          windowBounds: { left: 140, top: 100, width: 680, height: 460 },
        });
  };
  const removeTab = () => {
    if (selectedTabId) tilery()?.getTab(selectedTabId)?.remove();
  };

  return (
    <aside className="playground-inspector" aria-label="Playground controls">
      <header className="playground-inspector__head">
        <div className="playground-inspector__brand-row">
          <Link href="/" className="playground-inspector__brand">
            Tilery
          </Link>
        </div>
      </header>

      <div className="playground-inspector__scroll">
        <AccordionRoot defaultOpen={['workspace', 'panel', 'tab']}>
          <AccordionItem value="workspace" title="Workspace">
            <Field
              label="Preset"
              hint="Replace the whole workspace"
              control={
                <Select
                  value=""
                  onChange={loadPreset}
                  options={[
                    { value: '', label: 'Load preset…' },
                    ...PG_PRESETS.map((p) => ({ value: p.id, label: p.label })),
                  ]}
                  ariaLabel="Preset"
                />
              }
            />
            <ButtonGroup>
              <Button variant="subtle" size="compact" onClick={saveLayout}>
                Save
              </Button>
              <Button
                variant="subtle"
                size="compact"
                onClick={restoreLayout}
                disabled={!hasSaved}>
                Restore
              </Button>
              <Button variant="subtle" size="compact" onClick={exportLayout}>
                {copied ? 'Copied!' : 'Export JSON'}
              </Button>
              <Button variant="subtle" size="compact" tone="danger" onClick={reset}>
                Reset
              </Button>
            </ButtonGroup>
            <Field
              label="Resizable"
              hint="All dividers"
              control={
                <SwitchInput
                  checked={global.resizable}
                  onChange={(v) => onGlobalChange({ resizable: v })}
                />
              }
            />
            <Field
              label="Action menu button"
              control={
                <SwitchInput
                  checked={global.showActionsButton}
                  onChange={(v) => onGlobalChange({ showActionsButton: v })}
                />
              }
            />
            <Field
              label="New-tab button"
              control={
                <SwitchInput
                  checked={global.showNewTabButton}
                  onChange={(v) => onGlobalChange({ showNewTabButton: v })}
                />
              }
            />
            <Field
              label="Handle hit size (px)"
              control={
                <NumberInput
                  value={global.resizeHandleHitSize}
                  onChange={(v) =>
                    onGlobalChange({ resizeHandleHitSize: v ?? 24 })
                  }
                  ariaLabel="Handle hit size (px)"
                />
              }
            />
            <Field
              label="Default min %"
              control={
                <NumberInput
                  value={global.minSize}
                  onChange={(v) => onGlobalChange({ minSize: v ?? 10 })}
                  ariaLabel="Default min %"
                />
              }
            />
            <Field
              label="Theme"
              control={
                <Select
                  value={themeId}
                  onChange={onThemeChange}
                  options={PG_THEMES.map((t) => ({ value: t.id, label: t.label }))}
                  ariaLabel="Theme"
                />
              }
            />
          </AccordionItem>

          <AccordionItem value="panel" title="Selected panel">
            {panels.length === 0 ? (
              <p className="playground-empty">
                No panels. Load a preset or reset the workspace.
              </p>
            ) : (
              <>
                <Field
                  label="Panel"
                  control={
                    <Select
                      value={selectedPanelId ?? ''}
                      onChange={onSelectPanel}
                      options={panelOptions}
                      ariaLabel="Panel"
                    />
                  }
                />
                {panel ? (
                  <>
                    <Field
                      label="Add tab"
                      control={
                        <Button
                          variant="subtle"
                          size="compact"
                          onClick={addTab}>
                          Add tab
                        </Button>
                      }
                    />
                    <Field
                      label="Split panel"
                      control={
                        <div className="playground-inline">
                          <Select
                            ariaLabel="Split direction"
                            value={splitDir}
                            onChange={(v) => setSplitDir(v as TileryDirection)}
                            options={DIRECTIONS}
                          />
                          <Button
                            variant="subtle"
                            size="compact"
                            onClick={splitPanel}>
                            Split
                          </Button>
                        </div>
                      }
                    />
                    <Field
                      label="Resizable"
                      control={
                        <SwitchInput
                          checked={panel.resizable}
                          onChange={(v) => patchPanel({ resizable: v })}
                        />
                      }
                    />
                    <Field
                      label="Draggable"
                      control={
                        <SwitchInput
                          checked={panel.draggable}
                          onChange={(v) => patchPanel({ draggable: v })}
                        />
                      }
                    />
                    <Field
                      label="Droppable"
                      control={
                        <SwitchInput
                          checked={panel.droppable}
                          onChange={(v) => patchPanel({ droppable: v })}
                        />
                      }
                    />
                    <Field
                      label="Locked"
                      hint="Resize + drag + drop off"
                      control={
                        <SwitchInput
                          checked={
                            !panel.resizable &&
                            !panel.draggable &&
                            !panel.droppable
                          }
                          onChange={(v) =>
                            patchPanel({
                              resizable: !v,
                              draggable: !v,
                              droppable: !v,
                            })
                          }
                        />
                      }
                    />
                    <Field
                      label="Min size %"
                      control={
                        <NumberInput
                          value={
                            typeof panel.minSize === 'number' ? panel.minSize : ''
                          }
                          placeholder="auto"
                          onChange={(v) => patchPanel({ minSize: v })}
                          ariaLabel="Min size %"
                        />
                      }
                    />
                    <Field
                      label="Max size %"
                      control={
                        <NumberInput
                          value={
                            typeof panel.maxSize === 'number' ? panel.maxSize : ''
                          }
                          placeholder="auto"
                          onChange={(v) => patchPanel({ maxSize: v })}
                          ariaLabel="Max size %"
                        />
                      }
                    />
                    <ButtonGroup>
                      <Button
                        variant="subtle"
                        size="compact"
                        active={panel.fullScreen}
                        onClick={toggleMaximize}>
                        {panel.fullScreen ? 'Restore' : 'Maximize'}
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        active={panel.container === 'floating'}
                        onClick={toggleFloat}>
                        {panel.container === 'floating' ? 'Dock' : 'Float'}
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        active={panel.poppedOut}
                        onClick={togglePopout}>
                        {panel.poppedOut ? 'Return' : 'Pop out'}
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        onClick={focusPanel}
                        disabled={panel.container !== 'floating'}>
                        Focus
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        tone="danger"
                        onClick={removePanel}>
                        Remove panel
                      </Button>
                    </ButtonGroup>
                  </>
                ) : null}
              </>
            )}
          </AccordionItem>

          <AccordionItem value="tab" title="Selected tab">
            {!panel || panel.tabs.length === 0 ? (
              <p className="playground-empty">This panel has no tabs.</p>
            ) : (
              <>
                <Field
                  label="Tab"
                  control={
                    <Select
                      value={selectedTabId ?? ''}
                      onChange={onSelectTab}
                      options={tabOptions}
                      ariaLabel="Tab"
                    />
                  }
                />
                {tab ? (
                  <>
                    <RenameField
                      key={tab.id}
                      initialTitle={tab.title}
                      onRename={renameTab}
                    />
                    <Field
                      label="Closable"
                      control={
                        <SwitchInput
                          checked={tab.closable}
                          onChange={(v) => setTabBehavior({ closable: v })}
                        />
                      }
                    />
                    <Field
                      label="Draggable"
                      control={
                        <SwitchInput
                          checked={tab.draggable}
                          onChange={(v) => setTabBehavior({ draggable: v })}
                        />
                      }
                    />
                    <Field
                      label="Locked"
                      hint="Close + drag off"
                      control={
                        <SwitchInput
                          checked={tabLocked}
                          onChange={(v) =>
                            setTabBehavior(
                              v
                                ? { locked: true }
                                : { closable: true, draggable: true },
                            )
                          }
                        />
                      }
                    />
                    {moveTargets.length > 0 ? (
                      <Field
                        label="Move to"
                        control={
                          <Select
                            value=""
                            onChange={moveTab}
                            options={[
                              { value: '', label: 'Move to panel…' },
                              ...moveTargets,
                            ]}
                            ariaLabel="Move to"
                          />
                        }
                      />
                    ) : null}
                    <ButtonGroup>
                      <Button
                        variant="subtle"
                        size="compact"
                        onClick={floatTab}>
                        Float tab
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        onClick={popoutTab}>
                        Pop out tab
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact"
                        tone="danger"
                        onClick={removeTab}
                        disabled={!tab.closable}>
                        Close tab
                      </Button>
                    </ButtonGroup>
                  </>
                ) : null}
              </>
            )}
          </AccordionItem>

          <AccordionItem value="activity" title="Activity">
            <div className="playground-activity-head">
              <span className="playground-row__hint">Recent events</span>
              <Button
                variant="subtle"
                size="compact"
                onClick={onClearEvents}
                disabled={events.length === 0}>
                Clear
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="playground-empty">No events yet. Interact above.</p>
            ) : (
              <ul className="playground-log">
                {events.map((event) => (
                  <li key={event.id} className="playground-log__row">
                    <span className="playground-log__type">{event.type}</span>
                    <span className="playground-log__detail">
                      {event.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AccordionItem>
        </AccordionRoot>
      </div>
      <AppearanceFooter
        className="playground-inspector__appearance"
        githubClassName="playground-inspector__icon"
      />
    </aside>
  );
}

function RenameField({
  initialTitle,
  onRename,
}: {
  initialTitle: string;
  onRename: (title: string) => void;
}) {
  const [draft, setDraft] = useState(initialTitle);
  return (
    <Field
      label="Title"
      control={
        <form
          className="playground-inline"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(draft);
          }}>
          <Input
            aria-label="Tab title"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button variant="subtle" size="compact" type="submit">
            Rename
          </Button>
        </form>
      }
    />
  );
}
