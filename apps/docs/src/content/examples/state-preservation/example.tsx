'use client';

import { useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import { Tilery } from '@tileryjs/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryTab,
} from '@tileryjs/react';
import { ExampleSection, TabContent } from '../example-ui';
import { Button } from '../../../components/ui/button';

type TabData = {
  title: string;
  kind: 'react' | 'form' | 'iframe';
};

// source-region state-preservation-layout
const initialLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'react-panel',
      size: 34,
      tabs: [
        {
          id: 'react-counter',
          data: { title: 'React counter', kind: 'react' },
        },
      ],
    },
    {
      type: 'group',
      direction: 'vertical',
      size: 66,
      children: [
        {
          type: 'panel',
          id: 'form-panel',
          size: 50,
          tabs: [
            {
              id: 'draft-form',
              data: { title: 'Uncontrolled form', kind: 'form' },
            },
          ],
        },
        {
          type: 'panel',
          id: 'iframe-panel',
          size: 50,
          tabs: [
            {
              id: 'iframe-counter',
              data: { title: 'Iframe counter', kind: 'iframe' },
            },
          ],
        },
      ],
    },
  ],
};
// end-source-region state-preservation-layout

export function Example() {
  return <StatePreservationExample />;
}

export function StatePreservationExample() {
  // source-region state-preservation-controller
  const tileryRef = useRef<TileryController | null>(null);

  const moveReactPanel = () => {
    tileryRef.current?.movePanel('react-panel', {
      splitPanel: 'form-panel',
      direction: 'right',
    });
  };

  const moveFormPanel = () => {
    tileryRef.current?.movePanel('form-panel', {
      splitPanel: 'iframe-panel',
      direction: 'right',
    });
  };

  const moveIframePanel = () => {
    tileryRef.current?.movePanel('iframe-panel', {
      splitPanel: 'react-panel',
      direction: 'left',
    });
  };
  // end-source-region state-preservation-controller

  return (
    <ExampleSection
      title="State preservation"
      description="Change the counters and form fields, then move each panel. The panel id and mounted content stay intact."
      actions={
        <>
          <Button type="button" size="compact" onClick={moveReactPanel}>
            Move React
          </Button>
          <Button type="button" size="compact" onClick={moveFormPanel}>
            Move form
          </Button>
          <Button type="button" size="compact" onClick={moveIframePanel}>
            Move iframe
          </Button>
        </>
      }>
      {/* source-region state-preservation-tilery */}
      <Tilery<TabData>
        ref={tileryRef as Ref<TileryController>}
        initialLayout={initialLayout}
        renderTabHeader={(tab) => <span>{tab.data.title}</span>}
        renderTabContent={renderContent}
      />
      {/* end-source-region state-preservation-tilery */}
    </ExampleSection>
  );
}

function renderContent(tab: TileryTab<TabData>) {
  if (tab.data.kind === 'react') {
    return (
      <TabContent meta="React state">
        <ReactCounter />
      </TabContent>
    );
  }
  if (tab.data.kind === 'form') {
    return (
      <TabContent meta="DOM state">
        <DraftForm />
      </TabContent>
    );
  }
  return (
    <TabContent meta="iframe document">
      <iframe
        title="Iframe counter"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={iframeCounterSrcDoc}
        style={iframeStyle}
      />
    </TabContent>
  );
}

function ReactCounter() {
  const [count, setCount] = useState(0);
  return (
    <div style={stackStyle}>
      <div style={valueStyle}>{count}</div>
      <Button
        type="button"
        size="compact"
        onClick={() => setCount((value) => value + 1)}>
        Increment
      </Button>
    </div>
  );
}

function DraftForm() {
  return (
    <div style={stackStyle}>
      <label style={fieldStyle}>
        Title
        <input
          defaultValue="Release notes"
          style={inputStyle}
          aria-label="Draft title"
        />
      </label>
      <label style={fieldStyle}>
        Notes
        <textarea
          defaultValue="This text is stored in the input element, not React state."
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          aria-label="Draft notes"
        />
      </label>
    </div>
  );
}

const iframeCounterSrcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #111827;
        color: #f8fafc;
        font: 14px system-ui, sans-serif;
      }
      main {
        display: grid;
        gap: 12px;
        justify-items: center;
      }
      output {
        font-size: 32px;
        font-weight: 700;
      }
      button {
        border: 1px solid #64748b;
        border-radius: 6px;
        padding: 7px 10px;
        background: #e2e8f0;
        color: #0f172a;
        font: inherit;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main>
      <output id="count">0</output>
      <button id="increment" type="button">Increment iframe</button>
    </main>
    <script>
      let count = 0;
      const output = document.getElementById('count');
      document.getElementById('increment').addEventListener('click', () => {
        count += 1;
        output.textContent = String(count);
      });
    </script>
  </body>
</html>`;

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  alignContent: 'start',
};

const valueStyle: CSSProperties = {
  width: 'fit-content',
  minWidth: 56,
  border: '1px solid var(--example-demo-border)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 28,
  fontWeight: 700,
  textAlign: 'center',
};

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  color: 'var(--example-demo-muted)',
  fontSize: 13,
};

const inputStyle: CSSProperties = {
  width: 'min(100%, 360px)',
  boxSizing: 'border-box',
  border: '1px solid var(--example-demo-border)',
  borderRadius: 6,
  padding: '8px 10px',
  background: 'var(--example-demo-panel-bg)',
  color: 'var(--example-demo-fg)',
  font: 'inherit',
};

const iframeStyle: CSSProperties = {
  display: 'block',
  width: 'min(100%, 420px)',
  height: 180,
  border: '1px solid var(--example-demo-border)',
  borderRadius: 6,
  background: '#111827',
};
