'use client';

import { useRef, type Ref } from 'react';
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

type TabData = { title: string; body: string };

const panelApiLayout: TileryInitialLayout<TabData> = {
  type: 'panel',
  id: 'main',
  tabs: [
    {
      id: 'welcome',
      data: {
        title: 'Welcome',
        body: 'Panel handles can append tabs, split panels, and remove panels.',
      },
    },
  ],
};

const tabApiLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'editor',
      size: 58,
      tabs: [
        {
          id: 'main-ts',
          data: {
            title: 'main.ts',
            body: 'Tab handles can move, activate, remove, and update data.',
          },
        },
        {
          id: 'search',
          data: {
            title: 'Search',
            body: 'This tab is activated if it already exists.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'terminal',
      size: 42,
      tabs: [
        {
          id: 'shell',
          data: {
            title: 'Shell',
            body: 'Programmatic moves can target another panel by id.',
          },
        },
      ],
    },
  ],
};

const workflowApiLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'workspace',
      size: 64,
      activeTabId: 'readme',
      tabs: [
        {
          id: 'readme',
          data: {
            title: 'README.md',
            body: 'openOrActivateTab() opens a missing tab once, then activates it on later calls.',
          },
        },
        {
          id: 'scratch',
          data: {
            title: 'Scratch',
            body: 'changeTabId() can replace a temporary tab id with an app-level id.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'inspector',
      size: 36,
      tabs: [
        {
          id: 'outline',
          closeable: false,
          data: {
            title: 'Outline',
            body: 'New workflow tabs are inserted near related tabs instead of appended blindly.',
          },
        },
      ],
    },
  ],
};

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
      <PanelApiExample />
      <TabApiExample />
      <WorkflowApiExample />
    </ExampleStack>
  );
}

// source-region panel-handles
export function PanelApiExample() {
  const tileryRef = useRef<TileryHandle | null>(null);
  const counterRef = useRef(0);

  const getFirstPanel = () => tileryRef.current?.getPanels()[0] ?? null;

  const addTab = () => {
    const panel = getFirstPanel();
    if (!panel) return;
    counterRef.current += 1;
    panel.appendTab({
      id: `tab-${counterRef.current}`,
      data: {
        title: `Tab ${counterRef.current}`,
        body: 'This tab was appended through a panel handle.',
      },
    });
  };

  const splitRight = () => {
    const panel = getFirstPanel();
    if (!panel) return;
    counterRef.current += 1;
    panel.split('right', {
      size: 48,
      tabs: [
        {
          id: `split-${counterRef.current}`,
          data: {
            title: `Split ${counterRef.current}`,
            body: 'This panel was created through panel.split().',
          },
        },
      ],
    });
  };

  const removeActive = () => {
    getFirstPanel()?.activeTab?.remove();
  };

  return (
    <ExampleSection
      title="Panel handles"
      description="Mutate the layout through handles returned by the Tilery ref."
      actions={
        <>
          <ExampleButton type="button" onClick={addTab}>
            Add Tab
          </ExampleButton>
          <ExampleButton type="button" onClick={splitRight}>
            Split Right
          </ExampleButton>
          <ExampleButton type="button" onClick={removeActive}>
            Remove Active
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as Ref<TileryHandle>}
        initialLayout={panelApiLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region panel-handles

// source-region tab-handles
export function TabApiExample() {
  const tileryRef = useRef<TileryHandle | null>(null);
  const renameCounterRef = useRef(0);

  const getActiveTab = (): TileryTabHandle<TabData> | null => {
    const tab =
      tileryRef.current?.getPanels().find((panel) => panel.activeTab)
        ?.activeTab ?? null;
    return tab as TileryTabHandle<TabData> | null;
  };

  const renameActive = () => {
    const tab = getActiveTab();
    if (!tab) return;
    renameCounterRef.current += 1;
    tab.setData({
      ...tab.data,
      title: `${tab.data.title} ${renameCounterRef.current}`,
    });
  };

  const moveActiveToTerminal = () => {
    const tab = getActiveTab();
    const terminal = tileryRef.current?.getPanel('terminal');
    if (!tab || !terminal || tab.panel.id === terminal.id) return;
    tab.moveTo({ panel: terminal.id, index: terminal.tabs.length });
  };

  const activateSearch = () => {
    tileryRef.current?.getTab('search')?.activate();
  };

  return (
    <ExampleSection
      title="Tab handles"
      description="Work with a tab directly when the app already knows which tab it wants."
      actions={
        <>
          <ExampleButton type="button" onClick={renameActive}>
            Rename Active
          </ExampleButton>
          <ExampleButton type="button" onClick={moveActiveToTerminal}>
            Move Active
          </ExampleButton>
          <ExampleButton type="button" onClick={activateSearch}>
            Activate Search
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as Ref<TileryHandle>}
        initialLayout={tabApiLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region tab-handles

// source-region tab-workflows
export function WorkflowApiExample() {
  const tileryRef = useRef<TileryHandle | null>(null);

  const openOrActivateSettings = () => {
    tileryRef.current?.openOrActivateTab(
      {
        id: 'settings',
        data: {
          title: 'Settings',
          body: 'This tab is created only once. Press the button again and Tilery activates the existing tab.',
        },
      },
      { afterTab: 'readme' },
    );
  };

  const openOrActivatePreview = () => {
    tileryRef.current?.openOrActivateTab(
      {
        id: 'preview',
        data: {
          title: 'Preview',
          body: 'A stable id lets the app avoid duplicate tabs for the same resource.',
        },
      },
      { panel: 'workspace', index: 1 },
    );
  };

  const toggleScratchId = () => {
    const tilery = tileryRef.current;
    if (!tilery) return;
    const oldId = tilery.getTab('scratch') ? 'scratch' : 'scratch-renamed';
    const newId = oldId === 'scratch' ? 'scratch-renamed' : 'scratch';
    tilery.changeTabId(oldId, newId)?.activate();
  };

  return (
    <ExampleSection
      title="Tab workflows"
      description="Use stable tab ids to open-or-activate resources and promote temporary ids when the app learns the final id."
      actions={
        <>
          <ExampleButton type="button" onClick={openOrActivateSettings}>
            Settings
          </ExampleButton>
          <ExampleButton type="button" onClick={openOrActivatePreview}>
            Preview
          </ExampleButton>
          <ExampleButton type="button" onClick={toggleScratchId}>
            Toggle Scratch ID
          </ExampleButton>
        </>
      }>
      <Tilery<TabData>
        ref={tileryRef as Ref<TileryHandle>}
        initialLayout={workflowApiLayout}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
    </ExampleSection>
  );
}
// end-source-region tab-workflows

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
