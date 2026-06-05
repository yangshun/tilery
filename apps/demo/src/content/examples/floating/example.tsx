'use client';

import { useRef, type CSSProperties } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryTab,
} from '@tilery/react';
import {
  ExampleButton,
  ExampleSection,
  ExampleStack,
  TabContent,
} from '../example-ui';

type TabData = { title: string; body: string; meta?: string };

const initialFloatingLayout: TileryInitialLayout<TabData> = {
  type: 'root',
  main: {
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'navigator',
        size: 28,
        tabs: [
          {
            id: 'files',
            data: {
              title: 'Files',
              body: 'Docked panels keep using the normal tiled layout tree.',
              meta: 'Docked',
            },
          },
        ],
      },
      {
        type: 'panel',
        id: 'editor',
        size: 72,
        tabs: [
          {
            id: 'readme',
            data: {
              title: 'README.md',
              body: 'Floating panels are serialized beside the main layout and layered above it.',
              meta: 'Editor',
            },
          },
        ],
      },
    ],
  },
  floating: [
    {
      type: 'floatingPanel',
      id: 'search',
      bounds: { x: 44, y: 12, width: 34, height: 48 },
      tabs: [
        {
          id: 'search-tab',
          data: {
            title: 'Search',
            body: 'Drag the empty tab-bar area to move this detached panel, or drag its edges to resize it.',
            meta: 'Floating',
          },
        },
      ],
    },
  ],
};

const runtimeFloatingLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'explorer',
      size: 32,
      tabs: [
        {
          id: 'explorer-tab',
          data: {
            title: 'Explorer',
            body: 'This panel can be detached through the button above.',
            meta: 'Source',
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
            body: 'Docking inserts the detached panel back into the tiled tree.',
            meta: 'Target',
          },
        },
      ],
    },
  ],
};

const popoutStylingLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'scoped-files',
      size: 34,
      tabs: [
        {
          id: 'scoped-files-tab',
          data: {
            title: 'Files',
            body: 'This in-page workspace inherits theme variables from a wrapper around Tilery.',
            meta: 'Wrapper theme',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'scoped-workspace',
      size: 66,
      tabs: [
        {
          id: 'scoped-workspace-tab',
          data: {
            title: 'Workspace',
            body: 'When this panel is popped out, the window receives copied stylesheet rules, but it does not inherit this wrapper element or its inline variables.',
            meta: 'Popout styling',
          },
        },
      ],
    },
  ],
};

const tabFloatingLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'editor',
      size: 64,
      activeTabId: 'notes-tab',
      tabs: [
        {
          id: 'readme-tab',
          data: {
            title: 'README.md',
            body: 'The editor panel keeps one tab when another tab is extracted.',
            meta: 'Editor',
          },
        },
        {
          id: 'notes-tab',
          data: {
            title: 'Notes.md',
            body: 'floatTab() creates a new floating panel that contains this tab.',
            meta: 'Extractable',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'preview',
      size: 36,
      tabs: [
        {
          id: 'preview-tab',
          data: {
            title: 'Preview',
            body: 'Move the notes tab back into the editor to remove its temporary panel.',
            meta: 'Target',
          },
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <ExampleStack rows="repeat(5, minmax(0, 1fr))">
      <InitialFloatingExample />
      <RuntimeFloatingExample />
      <TabFloatingExample />
      <NativePopoutExample />
      <PopoutStylingExample />
    </ExampleStack>
  );
}

// source-region initial-floating
export function InitialFloatingExample() {
  return (
    <ExampleSection
      title="Initial floating layout"
      description="Use a root layout when the workspace starts with detached panels.">
      <Tilery<TabData>
        initialLayout={initialFloatingLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
        showActionsButton
      />
    </ExampleSection>
  );
}
// end-source-region initial-floating

// source-region runtime-floating
export function RuntimeFloatingExample() {
  const tileryRef = useRef<TileryController | null>(null);

  const floatExplorer = () => {
    tileryRef.current?.floatPanel('explorer', {
      x: 10,
      y: 14,
      width: 34,
      height: 52,
      resizable: false,
    });
  };

  const dockExplorer = () => {
    tileryRef.current?.dockPanel('explorer', {
      splitPanel: 'workspace',
      direction: 'left',
      size: 34,
    });
  };

  const focusExplorer = () => {
    tileryRef.current?.focusPanel('explorer');
  };

  return (
    <ExampleSection
      title="Runtime float and dock"
      description="Panels can be detached with runtime options, focused, moved, and inserted back into the tiled tree. This Explorer panel floats with resizing disabled."
      actions={
        <>
          <ExampleButton type="button" onClick={floatExplorer}>
            Float explorer
          </ExampleButton>
          <ExampleButton type="button" onClick={focusExplorer}>
            Focus explorer
          </ExampleButton>
          <ExampleButton type="button" onClick={dockExplorer}>
            Dock explorer
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={runtimeFloatingLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
        showActionsButton
      />
    </ExampleSection>
  );
}
// end-source-region runtime-floating

// source-region tab-floating
export function TabFloatingExample() {
  const tileryRef = useRef<TileryController | null>(null);

  const floatNotes = () => {
    tileryRef.current?.floatTab('notes-tab', {
      panelId: 'notes-floating',
      bounds: { x: 12, y: 16, width: 38, height: 48 },
    });
  };

  const popoutNotes = () => {
    tileryRef.current?.popoutTab('notes-tab', {
      panelId: 'notes-popout',
      floatingBounds: { x: 12, y: 16, width: 38, height: 48 },
      windowBounds: { left: 160, top: 110, width: 680, height: 460 },
    });
  };

  const moveNotesBack = () => {
    tileryRef.current?.moveTab('notes-tab', {
      panel: 'editor',
      index: 1,
    });
  };

  return (
    <ExampleSection
      title="Floating a single tab"
      description="Extract one tab into its own floating panel without detaching the rest of the source panel."
      actions={
        <>
          <ExampleButton type="button" onClick={floatNotes}>
            Float notes
          </ExampleButton>
          <ExampleButton type="button" onClick={popoutNotes}>
            Pop out notes
          </ExampleButton>
          <ExampleButton type="button" onClick={moveNotesBack}>
            Move notes back
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={tabFloatingLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
        showActionsButton
      />
    </ExampleSection>
  );
}
// end-source-region tab-floating

// source-region native-popout
export function NativePopoutExample() {
  const tileryRef = useRef<TileryController | null>(null);

  const popoutWorkspace = () => {
    tileryRef.current?.popoutPanel('workspace', {
      floatingBounds: { x: 12, y: 14, width: 42, height: 56 },
      windowBounds: { left: 120, top: 90, width: 760, height: 540 },
    });
  };

  const returnWorkspace = () => {
    tileryRef.current?.returnPanelToFloating('workspace');
  };

  const dockWorkspace = () => {
    tileryRef.current?.dockPanel('workspace', {
      splitPanel: 'explorer',
      direction: 'right',
      size: 68,
    });
  };

  return (
    <ExampleSection
      title="Native popout window"
      description="Open a panel in a same-origin browser window while keeping its React subtree connected."
      actions={
        <>
          <ExampleButton type="button" onClick={popoutWorkspace}>
            Pop out workspace
          </ExampleButton>
          <ExampleButton type="button" onClick={returnWorkspace}>
            Return floating
          </ExampleButton>
          <ExampleButton type="button" onClick={dockWorkspace}>
            Dock workspace
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={runtimeFloatingLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
        showActionsButton
      />
    </ExampleSection>
  );
}
// end-source-region native-popout

// source-region popout-styling
const popoutScopedThemeStyle = {
  height: '100%',
  '--tilery-bg': '#10201f',
  '--tilery-panel-bg': '#162b2a',
  '--tilery-tabbar-bg': '#0f2423',
  '--tilery-tab-active-bg': '#1f3f3d',
  '--tilery-tab-active-fg': '#effcf8',
  '--tilery-accent': '#38c7a6',
  '--tilery-drop-bg': 'rgba(56, 199, 166, 0.16)',
  '--tilery-drop-border': 'rgba(56, 199, 166, 0.55)',
} as CSSProperties;

export function PopoutStylingExample() {
  const tileryRef = useRef<TileryController | null>(null);

  const popoutWorkspace = () => {
    tileryRef.current?.popoutPanel('scoped-workspace', {
      floatingBounds: { x: 16, y: 18, width: 42, height: 52 },
      windowBounds: { left: 180, top: 120, width: 720, height: 500 },
    });
  };

  const returnWorkspace = () => {
    tileryRef.current?.returnPanelToFloating('scoped-workspace');
  };

  return (
    <ExampleSection
      title="Popout styling context"
      description="Popout windows copy style and stylesheet tags from the document head, but they do not copy wrapper elements, html/body classes, or inline CSS variables."
      actions={
        <>
          <ExampleButton type="button" onClick={popoutWorkspace}>
            Pop out workspace
          </ExampleButton>
          <ExampleButton type="button" onClick={returnWorkspace}>
            Return floating
          </ExampleButton>
        </>
      }>
      <div style={popoutScopedThemeStyle}>
        <Tilery<TabData>
          ref={tileryRef as React.Ref<TileryController>}
          initialLayout={popoutStylingLayout}
          renderTabHeader={renderHeader}
          renderTabContent={renderContent}
          showActionsButton
        />
      </div>
    </ExampleSection>
  );
}
// end-source-region popout-styling

function renderHeader(tab: TileryTab<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTab<TabData>) {
  return (
    <TabContent meta={tab.data.meta}>
      <p>{tab.data.body}</p>
    </TabContent>
  );
}
