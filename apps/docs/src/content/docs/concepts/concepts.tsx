import { useRef } from 'react';
import { Tilery } from '@tileryjs/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryTab,
} from '@tileryjs/react';

type MyTabData = { title: string };

const defaultLayout: TileryInitialLayout<MyTabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'a', data: { title: 'Panel A' } }],
    },
    {
      type: 'panel',
      id: 'right',
      size: 50,
      tabs: [{ id: 'b', data: { title: 'Panel B' } }],
    },
  ],
};

const renderTabHeader = (tab: TileryTab<MyTabData>) => (
  <span>{tab.data.title}</span>
);

const renderTabContent = (tab: TileryTab<MyTabData>) => (
  <div>{tab.data.title} content</div>
);

export function App() {
  const tileryRef = useRef<TileryController>(null);

  // source-region persistence
  const saved = localStorage.getItem('tilery-layout');

  return (
    <Tilery
      ref={tileryRef}
      initialLayout={saved ? JSON.parse(saved) : defaultLayout}
      onChange={() => {
        const layout = tileryRef.current?.getLayout<MyTabData>();
        if (layout) {
          localStorage.setItem('tilery-layout', JSON.stringify(layout));
        }
      }}
      renderTabHeader={renderTabHeader}
      renderTabContent={renderTabContent}
    />
  );
  // end-source-region persistence
}
