'use client';

import { useMemo } from 'react';
import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, ExampleStack } from '../example-ui';
import type { CSSProperties, ReactNode } from 'react';

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

type ThemeSpec = {
  name: string;
  description: string;
  style: ThemeStyle;
};

type TabData = {
  title: string;
  kind: 'files' | 'editor' | 'terminal' | 'preview';
  accent: string;
};

export function Example() {
  return (
    <ExampleStack rows="repeat(2, minmax(0, 1fr))">
      <AbyssThemeExample />
      <LightThemeExample />
    </ExampleStack>
  );
}

// source-region abyss
const abyssTheme = {
  name: 'Abyss',
  description:
    'Deep blue surfaces, high-contrast foregrounds, and a cyan active tab accent.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#000c18',
    '--tilery-fg': '#d7ecff',
    '--tilery-panel-bg': '#001b33',
    '--tilery-panel-border': '#123a58',
    '--tilery-tabbar-bg': '#001426',
    '--tilery-tabbar-height': '32px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#8db9d6',
    '--tilery-tab-active-bg': '#002440',
    '--tilery-tab-active-fg': '#f4fbff',
    '--tilery-tab-hover-bg': '#052b4a',
    '--tilery-menu-bg': '#02243f',
    '--tilery-menu-shadow': '0 12px 28px rgba(0, 7, 16, 0.54)',
    '--tilery-action-hover-bg': '#0b3555',
    '--tilery-accent': '#4db8ff',
    '--tilery-drop-bg': 'rgba(77, 184, 255, 0.18)',
    '--tilery-drop-border': 'rgba(77, 184, 255, 0.72)',
    '--tilery-resize-handle-active-bg': 'rgba(77, 184, 255, 0.62)',
    '--tilery-panel-gap': '4px',
    '--tilery-outer-gap': '4px',
    '--theme-content-bg': '#00162b',
    '--theme-content-muted': '#86aeca',
    '--theme-content-border': '#164566',
    '--theme-code-bg': '#000f1e',
  },
} satisfies ThemeSpec;

export function AbyssThemeExample() {
  return <ThemeDemo id="abyss" theme={abyssTheme} />;
}
// end-source-region abyss

// source-region visual-studio
const visualStudioTheme = {
  name: 'Visual Studio',
  description:
    'A familiar editor shell with charcoal panels, blue focus, and restrained contrast.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#1e1e1e',
    '--tilery-fg': '#cccccc',
    '--tilery-panel-bg': '#252526',
    '--tilery-panel-border': '#3c3c3c',
    '--tilery-tabbar-bg': '#2d2d30',
    '--tilery-tabbar-height': '32px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#969696',
    '--tilery-tab-active-bg': '#1e1e1e',
    '--tilery-tab-active-fg': '#ffffff',
    '--tilery-tab-hover-bg': '#333337',
    '--tilery-menu-bg': '#252526',
    '--tilery-menu-shadow': '0 8px 24px rgba(0, 0, 0, 0.4)',
    '--tilery-action-hover-bg': '#37373d',
    '--tilery-accent': '#007acc',
    '--tilery-drop-bg': 'rgba(0, 122, 204, 0.18)',
    '--tilery-drop-border': 'rgba(0, 122, 204, 0.7)',
    '--tilery-resize-handle-active-bg': 'rgba(0, 122, 204, 0.64)',
    '--tilery-panel-gap': '3px',
    '--tilery-outer-gap': '3px',
    '--theme-content-bg': '#1e1e1e',
    '--theme-content-muted': '#9cdcfe',
    '--theme-content-border': '#3c3c3c',
    '--theme-code-bg': '#1b1b1b',
  },
} satisfies ThemeSpec;

export function VisualStudioThemeExample() {
  return <ThemeDemo id="visual-studio" theme={visualStudioTheme} />;
}
// end-source-region visual-studio

// source-region dracula
const draculaTheme = {
  name: 'Dracula',
  description:
    'Purple chrome, saturated accents, and soft pink highlights for active tabs.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#191a21',
    '--tilery-fg': '#f8f8f2',
    '--tilery-panel-bg': '#282a36',
    '--tilery-panel-border': '#44475a',
    '--tilery-tabbar-bg': '#21222c',
    '--tilery-tabbar-height': '34px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#bdc0d6',
    '--tilery-tab-active-bg': '#343746',
    '--tilery-tab-active-fg': '#ffffff',
    '--tilery-tab-hover-bg': '#303241',
    '--tilery-menu-bg': '#282a36',
    '--tilery-menu-shadow': '0 12px 30px rgba(0, 0, 0, 0.42)',
    '--tilery-action-hover-bg': '#3a3d4f',
    '--tilery-accent': '#ff79c6',
    '--tilery-drop-bg': 'rgba(255, 121, 198, 0.18)',
    '--tilery-drop-border': 'rgba(255, 121, 198, 0.72)',
    '--tilery-resize-handle-active-bg': 'rgba(255, 121, 198, 0.6)',
    '--tilery-panel-gap': '4px',
    '--tilery-outer-gap': '4px',
    '--theme-content-bg': '#242631',
    '--theme-content-muted': '#bd93f9',
    '--theme-content-border': '#4e5268',
    '--theme-code-bg': '#1f2029',
  },
} satisfies ThemeSpec;

export function DraculaThemeExample() {
  return <ThemeDemo id="dracula" theme={draculaTheme} />;
}
// end-source-region dracula

// source-region light
const lightTheme = {
  name: 'Light',
  description:
    'Bright surfaces with neutral borders and a strong blue active-tab affordance.',
  style: {
    colorScheme: 'light',
    '--tilery-bg': '#f4f6fb',
    '--tilery-fg': '#1f2937',
    '--tilery-panel-bg': '#ffffff',
    '--tilery-panel-border': '#d8dee8',
    '--tilery-tabbar-bg': '#edf1f7',
    '--tilery-tabbar-height': '34px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#667085',
    '--tilery-tab-active-bg': '#ffffff',
    '--tilery-tab-active-fg': '#111827',
    '--tilery-tab-hover-bg': '#e2e8f2',
    '--tilery-menu-bg': '#ffffff',
    '--tilery-menu-shadow': '0 10px 26px rgba(39, 51, 77, 0.16)',
    '--tilery-action-hover-bg': '#e5ebf4',
    '--tilery-accent': '#2563eb',
    '--tilery-drop-bg': 'rgba(37, 99, 235, 0.14)',
    '--tilery-drop-border': 'rgba(37, 99, 235, 0.55)',
    '--tilery-resize-handle-active-bg': 'rgba(37, 99, 235, 0.62)',
    '--tilery-panel-gap': '4px',
    '--tilery-outer-gap': '4px',
    '--theme-content-bg': '#ffffff',
    '--theme-content-muted': '#526071',
    '--theme-content-border': '#dde3ed',
    '--theme-code-bg': '#f3f6fb',
  },
} satisfies ThemeSpec;

export function LightThemeExample() {
  return <ThemeDemo id="light" theme={lightTheme} />;
}
// end-source-region light

// source-region replit
const replitTheme = {
  name: 'Replit',
  description:
    'Dark navy panels, low-saturation borders, and a warm orange accent.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#0e1525',
    '--tilery-fg': '#f5f9fc',
    '--tilery-panel-bg': '#1c2333',
    '--tilery-panel-border': '#30394f',
    '--tilery-tabbar-bg': '#131b2c',
    '--tilery-tabbar-height': '34px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#a5adba',
    '--tilery-tab-active-bg': '#20283a',
    '--tilery-tab-active-fg': '#ffffff',
    '--tilery-tab-hover-bg': '#26314a',
    '--tilery-menu-bg': '#1c2333',
    '--tilery-menu-shadow': '0 12px 28px rgba(2, 6, 23, 0.5)',
    '--tilery-action-hover-bg': '#2a344a',
    '--tilery-accent': '#f26207',
    '--tilery-drop-bg': 'rgba(242, 98, 7, 0.16)',
    '--tilery-drop-border': 'rgba(242, 98, 7, 0.65)',
    '--tilery-resize-handle-active-bg': 'rgba(242, 98, 7, 0.62)',
    '--tilery-panel-gap': '4px',
    '--tilery-outer-gap': '4px',
    '--theme-content-bg': '#171f2f',
    '--theme-content-muted': '#c2cad8',
    '--theme-content-border': '#384258',
    '--theme-code-bg': '#101827',
  },
} satisfies ThemeSpec;

export function ReplitThemeExample() {
  return <ThemeDemo id="replit" theme={replitTheme} />;
}
// end-source-region replit

// source-region abyss-spaced
const abyssSpacedTheme = {
  name: 'Abyss Spaced',
  description:
    'The same Abyss palette with larger panel and outer gaps for a separated workspace.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#000c18',
    '--tilery-fg': '#d7ecff',
    '--tilery-panel-bg': '#001b33',
    '--tilery-panel-border': '#123a58',
    '--tilery-tabbar-bg': '#001426',
    '--tilery-tabbar-height': '34px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#8db9d6',
    '--tilery-tab-active-bg': '#002440',
    '--tilery-tab-active-fg': '#f4fbff',
    '--tilery-tab-hover-bg': '#052b4a',
    '--tilery-menu-bg': '#02243f',
    '--tilery-menu-shadow': '0 12px 28px rgba(0, 7, 16, 0.54)',
    '--tilery-action-hover-bg': '#0b3555',
    '--tilery-accent': '#4db8ff',
    '--tilery-drop-bg': 'rgba(77, 184, 255, 0.18)',
    '--tilery-drop-border': 'rgba(77, 184, 255, 0.72)',
    '--tilery-resize-handle-active-bg': 'rgba(77, 184, 255, 0.62)',
    '--tilery-panel-gap': '9px',
    '--tilery-outer-gap': '9px',
    '--theme-content-bg': '#00162b',
    '--theme-content-muted': '#86aeca',
    '--theme-content-border': '#164566',
    '--theme-code-bg': '#000f1e',
  },
} satisfies ThemeSpec;

export function AbyssSpacedThemeExample() {
  return <ThemeDemo id="abyss-spaced" theme={abyssSpacedTheme} />;
}
// end-source-region abyss-spaced

// source-region pill-tabs
const pillTabsTheme = {
  name: 'Pill Tabs',
  description:
    'A class override theme that rounds tabs into pills while variables keep the palette centralized.',
  style: {
    colorScheme: 'dark',
    '--tilery-bg': '#111318',
    '--tilery-fg': '#f3f4f7',
    '--tilery-panel-bg': '#1b1f2a',
    '--tilery-panel-border': '#2f3545',
    '--tilery-tabbar-bg': '#151923',
    '--tilery-tabbar-height': '42px',
    '--tilery-tab-font-size': '12px',
    '--tilery-tab-fg': '#aeb6c5',
    '--tilery-tab-active-bg': '#f3f4f7',
    '--tilery-tab-active-fg': '#111318',
    '--tilery-tab-hover-bg': '#252b38',
    '--tilery-menu-bg': '#1f2530',
    '--tilery-menu-shadow': '0 14px 30px rgba(0, 0, 0, 0.38)',
    '--tilery-action-hover-bg': '#2b3342',
    '--tilery-accent': '#7dd3fc',
    '--tilery-drop-bg': 'rgba(125, 211, 252, 0.16)',
    '--tilery-drop-border': 'rgba(125, 211, 252, 0.68)',
    '--tilery-resize-handle-active-bg': 'rgba(125, 211, 252, 0.62)',
    '--tilery-panel-gap': '5px',
    '--tilery-outer-gap': '5px',
    '--theme-content-bg': '#161b25',
    '--theme-content-muted': '#bac4d2',
    '--theme-content-border': '#343c4c',
    '--theme-code-bg': '#111722',
  },
} satisfies ThemeSpec;

const pillTabsCss = `
.tilery-theme-pill-tabs .tilery__tab-list {
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
}

.tilery-theme-pill-tabs .tilery__tab {
  height: 26px;
  padding: 0 10px;
  border-right: 0;
  border-radius: 999px;
}

.tilery-theme-pill-tabs .tilery__tab[data-active='true'] {
  box-shadow: none;
}

.tilery-theme-pill-tabs .tilery__tab[data-closable='false'] {
  padding: 0 10px;
}

.tilery-theme-pill-tabs .tilery__tab-close {
  border-radius: 999px;
}
`;

export function PillTabsThemeExample() {
  return (
    <ThemeDemo
      id="pill-tabs"
      theme={pillTabsTheme}
      className="tilery-theme-pill-tabs">
      <style>{pillTabsCss}</style>
    </ThemeDemo>
  );
}
// end-source-region pill-tabs

function ThemeDemo({
  id,
  theme,
  className,
  children,
}: {
  id: string;
  theme: ThemeSpec;
  className?: string;
  children?: ReactNode;
}) {
  const layout = useMemo(() => createThemeLayout(id), [id]);

  return (
    <ExampleSection title={theme.name} description={theme.description}>
      {/* source-region theme-demo-tilery */}
      <div className={className} style={{ ...themeShellStyle, ...theme.style }}>
        {children}
        <Tilery<TabData>
          initialLayout={layout}
          showActionsButton
          renderTabHeader={renderHeader}
          renderTabContent={renderContent}
        />
      </div>
      {/* end-source-region theme-demo-tilery */}
    </ExampleSection>
  );
}

function createThemeLayout(prefix: string): TileryInitialLayout<TabData> {
  return {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: `${prefix}-files`,
        size: 28,
        tabs: [
          {
            id: `${prefix}-files-tab`,
            data: { title: 'Files', kind: 'files', accent: '#3aaf6f' },
            closable: false,
          },
        ],
      },
      {
        type: 'group',
        direction: 'vertical',
        size: 72,
        children: [
          {
            type: 'panel',
            id: `${prefix}-editor`,
            size: 65,
            tabs: [
              {
                id: `${prefix}-editor-tab`,
                data: { title: 'index.ts', kind: 'editor', accent: '#3884ff' },
              },
              {
                id: `${prefix}-preview-tab`,
                data: { title: 'Preview', kind: 'preview', accent: '#9b5ad6' },
              },
            ],
          },
          {
            type: 'panel',
            id: `${prefix}-terminal`,
            size: 35,
            tabs: [
              {
                id: `${prefix}-terminal-tab`,
                data: {
                  title: 'Terminal',
                  kind: 'terminal',
                  accent: '#d28e2a',
                },
                closable: false,
              },
            ],
          },
        ],
      },
    ],
  };
}

function renderHeader(tab: TileryTab<TabData>) {
  return (
    <>
      <span style={{ ...swatchStyle, background: tab.data.accent }} />
      <span>{tab.data.title}</span>
    </>
  );
}

function renderContent(tab: TileryTab<TabData>) {
  return (
    <div style={contentStyle}>
      {tab.data.kind === 'files' ? (
        <div style={fileListStyle}>
          <div>src/</div>
          <div style={nestedFileStyle}>components/</div>
          <div style={nestedFileStyle}>index.ts</div>
          <div>package.json</div>
        </div>
      ) : null}
      {tab.data.kind === 'editor' ? (
        <pre style={codeStyle}>{`type Theme = {
  accent: string;
  gap: number;
};

export const tileryTheme: Theme = {
  accent: '${tab.data.accent}',
  gap: 4,
};`}</pre>
      ) : null}
      {tab.data.kind === 'preview' ? (
        <div style={previewStyle}>
          <div style={previewBarStyle} />
          <div style={previewRowStyle} />
          <div style={{ ...previewRowStyle, width: '72%' }} />
          <div style={{ ...previewRowStyle, width: '48%' }} />
        </div>
      ) : null}
      {tab.data.kind === 'terminal' ? (
        <pre style={terminalStyle}>
          {'$ pnpm dev\nready in 420ms\nwatching theme tokens'}
        </pre>
      ) : null}
    </div>
  );
}

const themeShellStyle: CSSProperties = {
  height: '100%',
  minHeight: 0,
};

const swatchStyle: CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
};

const contentStyle: CSSProperties = {
  height: '100%',
  padding: 16,
  overflow: 'hidden',
  background: 'var(--theme-content-bg)',
  color: 'var(--tilery-fg)',
  fontSize: 14,
  lineHeight: 1.45,
};

const fileListStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  color: 'var(--theme-content-muted)',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};

const nestedFileStyle: CSSProperties = {
  paddingLeft: 14,
};

const codeStyle: CSSProperties = {
  height: '100%',
  margin: 0,
  padding: 14,
  overflow: 'auto',
  border: '1px solid var(--theme-content-border)',
  borderRadius: 5,
  background: 'var(--theme-code-bg)',
  color: 'var(--tilery-fg)',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};

const terminalStyle: CSSProperties = {
  ...codeStyle,
  color: 'var(--theme-content-muted)',
};

const previewStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 10,
  height: '100%',
  padding: 14,
  border: '1px solid var(--theme-content-border)',
  borderRadius: 5,
  background: 'var(--theme-code-bg)',
};

const previewBarStyle: CSSProperties = {
  width: 92,
  height: 10,
  borderRadius: 999,
  background: 'var(--tilery-accent)',
};

const previewRowStyle: CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 999,
  background: 'color-mix(in srgb, var(--theme-content-muted), transparent 36%)',
};
