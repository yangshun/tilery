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
import { ACCENT_IDS } from '../../content/accents';
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
  IconButton,
  StatusChip,
} from '../../components/ui';
import { AppearanceFooter } from '../../components/appearance-footer';
import {
  ExampleSection,
  TabContent,
  EmptyState,
} from '../../content/examples/example-ui';
import styles from './design-showcase.module.css';

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

export function DesignShowcase() {
  const [toggleOn, setToggleOn] = useState(true);
  const [locked, setLocked] = useState(false);
  const [theme, setTheme] = useState('abyss');
  const [size, setSize] = useState<number | ''>(24);
  const [title, setTitle] = useState('Editor');
  const [exampleDirty, setExampleDirty] = useState(false);

  return (
    <>
      <section
        className={styles.section}
        aria-labelledby="design-foundation-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-foundation-title">Tokens and type</h2>
          <p>
            The demo site is driven by theme-aware tokens, compact typography,
            and direct surface states.
          </p>
        </div>
        <div
          className={styles.specimenGrid + ' ' + styles['specimenGrid--two']}>
          <DesignSpecimen
            title="Theme tokens"
            description="Core values that adapt across dark, light, and accent choices.">
            <ul className={styles.tokenList}>
              {tokenRows.map((token) => (
                <li key={token.name} className={styles.token}>
                  <span
                    className={styles['token__swatch']}
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
            <div className={styles.typeStack}>
              <div>
                <span className={styles.label}>Page title</span>
                <div
                  className={
                    styles.typeSample + ' ' + styles['typeSample--title']
                  }>
                  Workspace controls
                </div>
              </div>
              <div>
                <span className={styles.label}>Section title</span>
                <div
                  className={
                    styles.typeSample + ' ' + styles['typeSample--section']
                  }>
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

      <section className={styles.section} aria-labelledby="design-button-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-button-title">Button</h2>
          <p>
            Variants cover page actions, primary calls to action, secondary
            buttons, and active, disabled, and danger states.
          </p>
        </div>
        <div
          className={styles.specimenGrid + ' ' + styles['specimenGrid--two']}>
          <DesignSpecimen
            title="Variants"
            description="Default, primary, secondary, strong, active, disabled, and danger.">
            <ButtonGroup>
              <Button>Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="strong">Strong</Button>
              <Button active>Active</Button>
              <Button disabled>Disabled</Button>
              <Button tone="danger">Danger</Button>
            </ButtonGroup>
          </DesignSpecimen>

          <DesignSpecimen
            title="Sizes"
            description="Default, compact, and hero heights for the same button.">
            <ButtonGroup>
              <Button size="hero">Hero</Button>
              <Button>Default</Button>
              <Button size="compact">Compact</Button>
            </ButtonGroup>
          </DesignSpecimen>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="design-icon-button-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-icon-button-title">IconButton</h2>
          <p>
            Square icon-only controls for toolbars, global theme switching, and
            accent selection.
          </p>
        </div>
        <DesignSpecimen
          title="Icon controls"
          description="Bare icons and live global controls.">
          <ButtonGroup>
            <IconButton aria-label="Search" title="Search">
              <RiSearchLine aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Settings" title="Settings">
              <RiSettings3Line aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="More actions" title="More actions">
              <RiMore2Line aria-hidden="true" />
            </IconButton>
            <IconButton aria-label="Close" title="Close">
              <RiCloseLine aria-hidden="true" />
            </IconButton>
            <ThemeToggle />
            <AccentSelector />
          </ButtonGroup>
          <div className={styles.accentRow} aria-label="Accent swatches">
            {ACCENT_IDS.map((accent) => (
              <span
                key={accent}
                className={`accent-picker__swatch accent-picker__swatch--${accent}`}
                aria-label={accent}
                role="img"
              />
            ))}
          </div>
        </DesignSpecimen>
      </section>

      <section className={styles.section} aria-labelledby="design-field-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-field-title">Field</h2>
          <p>
            Label-on-left, control-on-right row, with an optional hint line.
            Pair with Switch, Select, Input, or NumberInput.
          </p>
        </div>
        <DesignSpecimen
          title="Field primitives"
          description="Switch, select, text input, and number input in a Field.">
          <div className="design-stack">
            <Field
              label="Resizable"
              hint="All dividers"
              control={
                <SwitchInput checked={toggleOn} onChange={setToggleOn} />
              }
            />
            <Field
              label="Theme"
              hint="Preview palette"
              control={
                <Select
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'abyss', label: 'Abyss' },
                    { value: 'visual-studio', label: 'Visual Studio' },
                    { value: 'light', label: 'Light' },
                  ]}
                  ariaLabel="Theme"
                />
              }
            />
            <Field
              label="Panel title"
              hint="Text input"
              control={
                <Input
                  aria-label="Panel title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              }
            />
            <Field
              label="Handle hit size"
              hint="Pointer target"
              control={
                <NumberInput
                  value={size}
                  onChange={(value) => setSize(value ?? '')}
                  ariaLabel="Handle hit size"
                />
              }
            />
          </div>
        </DesignSpecimen>
      </section>

      <section
        className={styles.section}
        aria-labelledby="design-accordion-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-accordion-title">Accordion</h2>
          <p>
            Collapsible sections keep dense controls scannable. Each panel keeps
            its content mounted.
          </p>
        </div>
        <DesignSpecimen
          title="Composed inspector"
          description="Accordion with Fields, Selects, and a ButtonGroup inside.">
          <div className={styles.playgroundPanel}>
            <AccordionRoot defaultOpen={['workspace', 'panel']}>
              <AccordionItem value="workspace" title="Workspace">
                <Field
                  label="Theme"
                  hint="Preview palette"
                  control={
                    <Select
                      value={theme}
                      onChange={setTheme}
                      options={[
                        { value: 'abyss', label: 'Abyss' },
                        { value: 'visual-studio', label: 'Visual Studio' },
                        { value: 'light', label: 'Light' },
                      ]}
                      ariaLabel="Theme"
                    />
                  }
                />
                <Field
                  label="Resizable"
                  hint="All dividers"
                  control={
                    <SwitchInput checked={toggleOn} onChange={setToggleOn} />
                  }
                />
                <Field
                  label="Handle hit size"
                  hint="Pointer target"
                  control={
                    <NumberInput
                      value={size}
                      onChange={(value) => setSize(value ?? '')}
                      ariaLabel="Handle hit size"
                    />
                  }
                />
                <ButtonGroup>
                  <Button variant="strong" size="compact">
                    <RiSave3Line aria-hidden="true" />
                    Save
                  </Button>
                  <Button size="compact">
                    <RiDownloadLine aria-hidden="true" />
                    Export
                  </Button>
                  <Button size="compact" tone="danger">
                    <RiRefreshLine aria-hidden="true" />
                    Reset
                  </Button>
                </ButtonGroup>
              </AccordionItem>

              <AccordionItem value="panel" title="Selected panel">
                <Field
                  label="Panel title"
                  hint="Text input"
                  control={
                    <Input
                      aria-label="Panel title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  }
                />
                <Field
                  label="Locked"
                  hint="Resize and drag"
                  control={
                    <SwitchInput checked={locked} onChange={setLocked} />
                  }
                />
                <ButtonGroup>
                  <Button variant="strong" size="compact" active={locked}>
                    <RiCheckLine aria-hidden="true" />
                    Lock
                  </Button>
                  <Button size="compact" disabled={!title}>
                    <RiAddLine aria-hidden="true" />
                    Add tab
                  </Button>
                </ButtonGroup>
              </AccordionItem>
            </AccordionRoot>
          </div>
        </DesignSpecimen>
      </section>

      <section className={styles.section} aria-labelledby="design-status-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-status-title">Status</h2>
          <p>
            Success and danger colors are used by transient actions such as copy
            feedback, destructive buttons, and failed commands.
          </p>
        </div>
        <div className={styles.statusGrid}>
          <StatusChip tone="success" label="Copied" />
          <StatusChip tone="danger" label="Copy failed" />
          <StatusChip tone="neutral" label="Idle" />
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="design-compositions-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-compositions-title">Compositions</h2>
          <p>
            Real pieces of the demo site built from the primitives above:
            example frames, footer actions, and a full playground-style
            inspector.
          </p>
        </div>
        <AccordionRoot defaultOpen={[]}>
          <AccordionItem value="example-frame" title="Example frame">
            <DesignSpecimen
              title="Example section"
              description="A reusable header, action row, frame, and reset control.">
              <div className={styles.exampleSurface}>
                <ExampleSection
                  title="Example section"
                  description="A reusable header, action row, frame, and reset control."
                  isDirty={exampleDirty}
                  onReset={() => setExampleDirty(false)}
                  actions={
                    <>
                      <Button
                        size="compact"
                        active={!exampleDirty}
                        onClick={() => setExampleDirty(false)}>
                        Stable
                      </Button>
                      <Button
                        size="compact"
                        active={exampleDirty}
                        onClick={() => setExampleDirty(true)}>
                        Modified
                      </Button>
                    </>
                  }>
                  <div className={styles.exampleContent}>
                    <div className={styles.exampleTabbar}>
                      <span data-active="true">Preview</span>
                      <span>Source</span>
                      <span>Events</span>
                    </div>
                    <TabContent meta={exampleDirty ? 'dirty' : 'ready'}>
                      <p>
                        Example content inherits the demo workspace palette
                        while the header and controls stay aligned with the site
                        chrome.
                      </p>
                      {exampleDirty ? (
                        <p>Reset returns the specimen to its original state.</p>
                      ) : (
                        <EmptyState>
                          Select Modified to reveal reset behavior.
                        </EmptyState>
                      )}
                    </TabContent>
                  </div>
                </ExampleSection>
              </div>
            </DesignSpecimen>
          </AccordionItem>

          <AccordionItem value="appearance-footer" title="Appearance footer">
            <DesignSpecimen
              title="Sidebar footer"
              description="Icon row (GitHub, theme, accent) plus a utility link, used at the bottom of the sidebar.">
              <div className="design-sidebar-footer">
                <AppearanceFooter githubClassName="" />
              </div>
            </DesignSpecimen>
          </AccordionItem>

          <AccordionItem value="playground-panel" title="Playground panel">
            <DesignSpecimen
              title="Inspector panel"
              description="A playground-style inspector built from Accordion, Field, Select, Switch, NumberInput, and ButtonGroup.">
              <div className={styles.playgroundPanel}>
                <AccordionRoot defaultOpen={['workspace', 'panel']}>
                  <AccordionItem value="workspace" title="Workspace">
                    <Field
                      label="Theme"
                      hint="Preview palette"
                      control={
                        <Select
                          value={theme}
                          onChange={setTheme}
                          options={[
                            { value: 'abyss', label: 'Abyss' },
                            { value: 'visual-studio', label: 'Visual Studio' },
                            { value: 'light', label: 'Light' },
                          ]}
                          ariaLabel="Theme"
                        />
                      }
                    />
                    <Field
                      label="Resizable"
                      hint="All dividers"
                      control={
                        <SwitchInput
                          checked={toggleOn}
                          onChange={setToggleOn}
                        />
                      }
                    />
                    <Field
                      label="Handle hit size"
                      hint="Pointer target"
                      control={
                        <NumberInput
                          value={size}
                          onChange={(value) => setSize(value ?? '')}
                          ariaLabel="Handle hit size"
                        />
                      }
                    />
                    <ButtonGroup>
                      <Button variant="strong" size="compact">
                        <RiSave3Line aria-hidden="true" />
                        Save
                      </Button>
                      <Button size="compact">
                        <RiDownloadLine aria-hidden="true" />
                        Export
                      </Button>
                      <Button size="compact" tone="danger">
                        <RiRefreshLine aria-hidden="true" />
                        Reset
                      </Button>
                    </ButtonGroup>
                  </AccordionItem>

                  <AccordionItem value="panel" title="Selected panel">
                    <Field
                      label="Panel title"
                      hint="Text input"
                      control={
                        <Input
                          aria-label="Panel title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                        />
                      }
                    />
                    <Field
                      label="Locked"
                      hint="Resize and drag"
                      control={
                        <SwitchInput checked={locked} onChange={setLocked} />
                      }
                    />
                    <ButtonGroup>
                      <Button variant="strong" size="compact" active={locked}>
                        <RiCheckLine aria-hidden="true" />
                        Lock
                      </Button>
                      <Button size="compact" disabled={!title}>
                        <RiAddLine aria-hidden="true" />
                        Add tab
                      </Button>
                    </ButtonGroup>
                  </AccordionItem>
                </AccordionRoot>
              </div>
            </DesignSpecimen>
          </AccordionItem>
        </AccordionRoot>
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
    <div className={styles.specimen}>
      <div className={styles.specimenHeader}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={styles.specimenBody}>{children}</div>
    </div>
  );
}
