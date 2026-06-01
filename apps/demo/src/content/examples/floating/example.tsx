'use client';

import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryHandle,
  TileryInitialLayout,
  TileryTabHandle,
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

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <InitialFloatingExample />
      <RuntimeFloatingExample />
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
  const tileryRef = useRef<TileryHandle | null>(null);

  const floatExplorer = () => {
    tileryRef.current?.floatPanel('explorer', {
      x: 10,
      y: 14,
      width: 34,
      height: 52,
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
      description="Panels can be detached, focused, moved, and inserted back into the tiled tree."
      actions={
        <>
          <ExampleButton type="button" onClick={floatExplorer}>
            Float Explorer
          </ExampleButton>
          <ExampleButton type="button" onClick={focusExplorer}>
            Focus Explorer
          </ExampleButton>
          <ExampleButton type="button" onClick={dockExplorer}>
            Dock Explorer
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryHandle>}
        initialLayout={runtimeFloatingLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
        showActionsButton
      />
    </ExampleSection>
  );
}
// end-source-region runtime-floating

function renderHeader(tab: TileryTabHandle<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTabHandle<TabData>) {
  return (
    <TabContent meta={tab.data.meta}>
      <p>{tab.data.body}</p>
    </TabContent>
  );
}
