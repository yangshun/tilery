'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiMore2Line,
  RiRefreshLine,
  RiSave3Line,
  RiSearchLine,
  RiSettings3Line,
} from 'react-icons/ri';
import { AccentSelector } from '../../components/accent-selector';
import { ThemeToggle } from '../../components/theme-toggle';
import {
  ButtonGrid,
  ControlRow,
  NumberRow,
  PgButton,
  SelectRow,
  Section,
  Sections,
  ToggleRow,
} from '../playground/playground-controls';
import {
  EmptyState,
  ExampleButton,
  ExampleSection,
  TabContent,
} from '../../content/examples/example-ui';

const tokenRows = [
  {
    name: '--site-bg',
    sample: 'var(--site-bg)',
    usage: 'Page background',
  },
  {
    name: '--site-fg',
    sample: 'var(--site-fg)',
    usage: 'Primary text',
  },
  {
    name: '--site-muted',
    sample: 'var(--site-muted)',
    usage: 'Secondary text',
  },
  {
    name: '--site-surface',
    sample: 'var(--site-surface)',
    usage: 'Raised surfaces',
  },
  {
    name: '--site-border',
    sample: 'var(--site-border)',
    usage: 'Dividers and frames',
  },
  {
    name: '--site-accent',
    sample: 'var(--site-accent)',
    usage: 'Focus and active states',
  },
] as const;

const accentIds = [
  'red',
  'orange',
  'amber',
  'lime',
  'teal',
  'sky',
  'purple',
  'white',
] as const;

export function DesignShowcase() {
  const [toggleOn, setToggleOn] = useState(true);
  const [locked, setLocked] = useState(false);
  const [theme, setTheme] = useState('Abyss');
  const [size, setSize] = useState<number | ''>(24);
  const [title, setTitle] = useState('Editor');
  const [exampleDirty, setExampleDirty] = useState(false);

  return (
    <>
      <section
        className="design-section"
        aria-labelledby="design-foundation-title">
        <div className="design-section__header">
          <h2 id="design-foundation-title">Tokens and type</h2>
          <p>
            The demo site is driven by theme-aware tokens, compact typography,
            and direct surface states.
          </p>
        </div>
        <div className="design-specimen-grid design-specimen-grid--two">
          <DesignSpecimen
            title="Theme tokens"
            description="Core values that adapt across dark, light, and accent choices.">
            <ul className="design-token-list">
              {tokenRows.map((token) => (
                <li key={token.name} className="design-token">
                  <span
                    className="design-token__swatch"
                    style={
                      {
                        '--design-token-sample': token.sample,
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <code>{token.name}</code>
                  <span>{token.usage}</span>
                </li>
              ))}
            </ul>
          </DesignSpecimen>

          <DesignSpecimen
            title="Typography"
            description="Content hierarchy used by docs, examples, and controls.">
            <div className="design-type-stack">
              <div>
                <span className="design-label">Page title</span>
                <div className="design-type-sample design-type-sample--title">
                  Workspace controls
                </div>
              </div>
              <div>
                <span className="design-label">Section title</span>
                <div className="design-type-sample design-type-sample--section">
                  Selected panel
                </div>
              </div>
              <p>
                Body copy uses muted color and a compact line height for dense
                technical pages with inline <code>code</code> fragments.
              </p>
            </div>
          </DesignSpecimen>
        </div>
      </section>

      <section
        className="design-section"
        aria-labelledby="design-buttons-title">
        <div className="design-section__header">
          <h2 id="design-buttons-title">Buttons and icon actions</h2>
          <p>
            Shared button classes cover page actions, example controls,
            playground commands, and toolbar icons.
          </p>
        </div>
        <div className="design-specimen-grid">
          <DesignSpecimen
            title="Site buttons"
            description="Base, emphasis, active, compact, disabled, and danger states.">
            <div className="design-button-row">
              <button type="button" className="site-button">
                Default
              </button>
              <button type="button" className="site-button site-button--primary">
                Primary
              </button>
              <button
                type="button"
                className="site-button site-button--secondary">
                Secondary
              </button>
              <button type="button" className="site-button site-button--strong">
                Strong
              </button>
              <button
                type="button"
                className="site-button site-button--compact">
                Compact
              </button>
              <button type="button" className="site-button" data-active="true">
                Active
              </button>
              <button type="button" className="site-button" disabled>
                Disabled
              </button>
              <button
                type="button"
                className="site-button site-button--danger">
                Danger
              </button>
            </div>
          </DesignSpecimen>

          <DesignSpecimen
            title="Icon controls"
            description="Toolbar icons, global theme switching, and accent selection.">
            <div className="design-icon-row">
              <button
                type="button"
                className="site-icon-button"
                aria-label="Search"
                title="Search">
                <RiSearchLine aria-hidden="true" />
              </button>
              <button
                type="button"
                className="site-icon-button"
                aria-label="Settings"
                title="Settings">
                <RiSettings3Line aria-hidden="true" />
              </button>
              <button
                type="button"
                className="site-icon-button"
                aria-label="More actions"
                title="More actions">
                <RiMore2Line aria-hidden="true" />
              </button>
              <button
                type="button"
                className="site-icon-button"
                aria-label="Close"
                title="Close">
                <RiCloseLine aria-hidden="true" />
              </button>
              <ThemeToggle />
              <AccentSelector />
            </div>
            <div className="design-accent-row" aria-label="Accent swatches">
              {accentIds.map((accent) => (
                <span
                  key={accent}
                  className={`accent-picker__swatch accent-picker__swatch--${accent}`}
                  aria-label={accent}
                  role="img"
                />
              ))}
            </div>
          </DesignSpecimen>
        </div>
      </section>

      <section
        className="design-section"
        aria-labelledby="design-examples-title">
        <div className="design-section__header">
          <h2 id="design-examples-title">Example frames</h2>
          <p>
            Example pages use a dark workspace surface with site-themed headers,
            action buttons, and reset handling.
          </p>
        </div>
        <div className="design-specimen design-specimen--wide">
          <div className="example-preview__demo-surface design-example-surface">
            <ExampleSection
              title="Example section"
              description="A reusable header, action row, frame, and reset control."
              isDirty={exampleDirty}
              onReset={() => setExampleDirty(false)}
              actions={
                <>
                  <ExampleButton
                    type="button"
                    active={!exampleDirty}
                    onClick={() => setExampleDirty(false)}>
                    Stable
                  </ExampleButton>
                  <ExampleButton
                    type="button"
                    active={exampleDirty}
                    onClick={() => setExampleDirty(true)}>
                    Modified
                  </ExampleButton>
                </>
              }>
              <div className="design-example-content">
                <div className="design-example-tabbar">
                  <span data-active="true">Preview</span>
                  <span>Source</span>
                  <span>Events</span>
                </div>
                <TabContent meta={exampleDirty ? 'dirty' : 'ready'}>
                  <p>
                    Example content inherits the demo workspace palette while
                    the header and controls stay aligned with the site chrome.
                  </p>
                  {exampleDirty ? (
                    <p>Reset returns the specimen to its original state.</p>
                  ) : (
                    <EmptyState>Select Modified to reveal reset behavior.</EmptyState>
                  )}
                </TabContent>
              </div>
            </ExampleSection>
          </div>
        </div>
      </section>

      <section
        className="design-section"
        aria-labelledby="design-playground-title">
        <div className="design-section__header">
          <h2 id="design-playground-title">Inspector controls</h2>
          <p>
            The playground composes a denser control set from shared buttons,
            rows, selects, toggles, numeric inputs, and text fields.
          </p>
        </div>
        <div className="design-specimen design-specimen--wide">
          <div className="design-playground-panel">
            <Sections defaultOpen={['workspace', 'panel']}>
              <Section value="workspace" title="Workspace">
                <SelectRow
                  label="Theme"
                  hint="Preview palette"
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'Abyss', label: 'Abyss' },
                    { value: 'Visual Studio', label: 'Visual Studio' },
                    { value: 'Light', label: 'Light' },
                  ]}
                />
                <ToggleRow
                  label="Resizable"
                  hint="All dividers"
                  checked={toggleOn}
                  onChange={setToggleOn}
                />
                <NumberRow
                  label="Handle hit size"
                  hint="Pointer target"
                  value={size}
                  onChange={(value) => setSize(value ?? '')}
                />
                <ButtonGrid>
                  <PgButton>
                    <RiSave3Line aria-hidden="true" />
                    Save
                  </PgButton>
                  <PgButton>
                    <RiDownloadLine aria-hidden="true" />
                    Export
                  </PgButton>
                  <PgButton variant="danger">
                    <RiRefreshLine aria-hidden="true" />
                    Reset
                  </PgButton>
                </ButtonGrid>
              </Section>

              <Section value="panel" title="Selected panel">
                <ControlRow
                  label="Panel title"
                  hint="Text input"
                  control={
                    <input
                      className="playground-text"
                      aria-label="Panel title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  }
                />
                <ToggleRow
                  label="Locked"
                  hint="Resize and drag"
                  checked={locked}
                  onChange={setLocked}
                />
                <ButtonGrid>
                  <PgButton variant="primary" active={locked}>
                    <RiCheckLine aria-hidden="true" />
                    Lock
                  </PgButton>
                  <PgButton disabled={!title}>
                    <RiAddLine aria-hidden="true" />
                    Add tab
                  </PgButton>
                </ButtonGrid>
              </Section>
            </Sections>
          </div>
        </div>
      </section>

      <section
        className="design-section"
        aria-labelledby="design-status-title">
        <div className="design-section__header">
          <h2 id="design-status-title">Status states</h2>
          <p>
            Success and danger colors are used by transient actions such as copy
            feedback, destructive buttons, and failed commands.
          </p>
        </div>
        <div className="design-status-grid">
          <StatusChip tone="success" label="Copied" />
          <StatusChip tone="danger" label="Copy failed" />
          <StatusChip tone="neutral" label="Idle" />
        </div>
      </section>
    </>
  );
}

function DesignSpecimen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="design-specimen">
      <div className="design-specimen__header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="design-specimen__body">{children}</div>
    </div>
  );
}

function StatusChip({
  tone,
  label,
}: {
  tone: 'danger' | 'neutral' | 'success';
  label: string;
}) {
  return <div className={`design-status design-status--${tone}`}>{label}</div>;
}
