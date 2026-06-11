'use client';

import { useEffect, useRef } from 'react';
import { capabilities, type HomeCapability } from './home-data';
import { cn } from '../../lib/cn';
import './home-capabilities.css';

const demoClassMap: Record<HomeCapability['demo'], string> = {
  'tab-move': 'cap-demo--tab-move',
  resize: 'cap-demo--resize',
  render: 'cap-demo--render',
  styling: 'cap-demo--styling',
  core: 'cap-demo--core',
  imperative: 'cap-demo--imperative',
  floating: 'cap-demo--floating',
  persist: 'cap-demo--persist',
  lock: 'cap-demo--lock',
};

function CapDemo({ type }: { type: HomeCapability['demo'] }) {
  switch (type) {
    case 'tab-move':
      return (
        <>
          <i className="capx absolute top-4 bottom-4 left-1/20 w-5/12 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx absolute top-4 bottom-4 right-1/20 w-5/12 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-drop absolute top-4 bottom-4 right-1/20 w-5/12 rounded bg-[var(--home-demo-drop-bg,rgba(163,230,53,0.18))] outline outline-1 outline-[var(--home-demo-drop-border,rgba(163,230,53,0.72))] opacity-0" />
          <i className="capx capx-fly absolute top-6 left-1/6 h-3.5 w-10 rounded bg-[var(--home-demo-accent,#a3e635)]" />
        </>
      );
    case 'resize':
      return (
        <>
          <i className="capx capx-rpane--l absolute top-4 bottom-4 left-1/20 right-1/2 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-rpane--r absolute top-4 bottom-4 left-1/2 right-1/20 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-grip absolute top-2 bottom-2 left-1/2 w-0.5 rounded-sm bg-[var(--home-demo-accent,#a3e635)] opacity-70" />
        </>
      );
    case 'render':
      return (
        <>
          <i className="capx absolute left-5 right-5 top-5 h-7 rounded-t bg-[var(--tilery-tabbar-bg,#16181c)] border border-[var(--tilery-panel-border,#2a2d33)] border-b-0" />
          <i className="capx capx-render-a absolute left-8 top-7 h-2 w-20 rounded bg-slate-600" />
          <i className="capx capx-render-icon absolute left-8 top-6 h-3.5 w-3.5 rounded bg-[var(--tilery-accent,#a3e635)] opacity-0" />
          <i className="capx capx-render-b absolute left-12 top-7 h-2 w-16 rounded bg-slate-400 opacity-0" />
        </>
      );
    case 'styling':
      return (
        <>
          <i className="capx absolute inset-x-0 top-0 h-7 bg-[var(--tilery-tabbar-bg,#16181c)] border-b border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-style-accent absolute left-3.5 top-0 h-1 w-14 bg-[var(--tilery-accent,#a3e635)]" />
          <i className="capx capx-style-swatch absolute left-4 top-11 h-5 w-12 rounded bg-[var(--tilery-accent,#a3e635)]" />
          <i className="capx absolute left-20 right-4 top-12 h-1.5 rounded bg-[var(--tilery-panel-border,#2a2d33)]" />
        </>
      );
    case 'core':
      return (
        <>
          <i className="capx capx-layer--3 absolute left-4 right-12 top-4 h-7 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-layer--2 absolute left-8 right-8 top-8 h-7 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-layer--1 absolute left-12 right-4 top-11 h-7 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-accent,#a3e635)]" />
        </>
      );
    case 'imperative':
      return (
        <>
          <span className="capx capx-line absolute left-4 top-4 overflow-hidden whitespace-nowrap font-mono text-xs text-[var(--tilery-fg,#d9dde3)] border-r-2 border-r-[var(--tilery-accent,#a3e635)]">
            panel.split()
          </span>
          <i className="capx capx-imp-a absolute top-11 bottom-4 left-4 right-4 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-imp-b absolute top-11 bottom-4 left-1/2 right-4 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)] opacity-0" />
        </>
      );
    case 'floating':
      return (
        <>
          <i className="capx absolute left-1/20 top-4 bottom-4 w-5/12 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx absolute right-1/20 top-4 bottom-4 w-5/12 rounded border border-dashed border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-float-panel absolute right-1/20 top-4 bottom-4 w-5/12 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)] shadow-md" />
        </>
      );
    case 'persist':
      return (
        <>
          <i className="capx capx-persist-pane--l absolute top-4 bottom-4 left-1/20 w-1/2 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-persist-pane--r absolute top-4 bottom-4 right-1/20 w-1/3 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <pre className="capx capx-persist-token absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 m-0 rounded bg-[var(--tilery-bg,#0e0f12)] border border-[var(--tilery-panel-border,#2a2d33)] px-2.5 py-2 font-mono text-xs leading-normal text-[var(--tilery-tab-fg,#9aa1ab)] whitespace-pre opacity-0">
            {'{ "panels": 2,\n  "tabs": 7 }'}
          </pre>
        </>
      );
    case 'lock':
      return (
        <>
          <i className="capx absolute top-4 bottom-4 left-1/20 right-1/2 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx absolute top-4 bottom-4 left-1/2 right-1/20 rounded bg-[var(--tilery-panel-bg,#1a1c20)] border border-[var(--tilery-panel-border,#2a2d33)]" />
          <i className="capx capx-lock-divider absolute left-1/2 top-2 bottom-2 w-0.5 -ml-px rounded-sm bg-[var(--tilery-accent,#a3e635)] opacity-70" />
          <i className="capx capx-lock-icon absolute left-1/4 top-1/2 h-3.5 w-4 -mt-1 -ml-2 rounded bg-white" />
          <i className="capx capx-lock-shackle absolute left-1/4 top-1/2 h-2 w-2.5 -mt-2.5 -ml-1 rounded-t-md border-2 border-white border-b-0" />
          <i className="capx capx-lock-icon absolute left-3/4 top-1/2 h-3.5 w-4 -mt-1 -ml-2 rounded bg-white" />
          <i className="capx capx-lock-shackle absolute left-3/4 top-1/2 h-2 w-2.5 -mt-2.5 -ml-1 rounded-t-md border-2 border-white border-b-0" />
        </>
      );
  }
}

export function CapabilitiesScene() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridRef.current?.setAttribute('data-play', 'true');
  }, []);

  return (
    <section className="mt-7" aria-labelledby="capabilities-title">
      <header className="max-w-3xl">
        <h2
          id="capabilities-title"
          className="m-0 border-0 p-0 text-[clamp(24px,3.2vw,40px)] font-semibold leading-none tracking-tighter text-site-fg">
          The primitives for panel-based apps.
        </h2>
      </header>

      <div
        ref={gridRef}
        className="cap-grid mt-7 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1"
        data-play="true">
        {capabilities.map((cap) => (
          <article
            key={cap.title}
            className="cap-card flex flex-col overflow-hidden rounded-md border border-[var(--tilery-panel-border,#2a2d33)] bg-[var(--tilery-panel-bg,#1a1c20)] text-[var(--tilery-fg,#d9dde3)] shadow-none transition-shadow duration-150 ease-in-out scheme-dark hover:shadow-[var(--home-cap-card-hover-shadow)] focus-within:shadow-[var(--home-cap-card-hover-shadow)]">
            <div className="home-cap-card__bar flex flex-none items-stretch h-[var(--tilery-tabbar-height,32px)] bg-[var(--tilery-tabbar-bg,#16181c)] border-b border-[var(--tilery-panel-border,#2a2d33)]">
              <div className="cap-tab--active relative inline-flex flex-none items-center gap-2 max-w-44 px-3 h-full text-[var(--tilery-tab-font-size,12px)] border-r border-[var(--tilery-panel-border,#2a2d33)] rounded-t-md whitespace-nowrap bg-[var(--tilery-tab-active-bg,var(--tilery-panel-bg,#1a1c20))] text-[var(--tilery-tab-active-fg,#f3f4f7)]">
                <span className="overflow-hidden text-ellipsis">
                  {cap.title}
                </span>
              </div>
            </div>
            <div className="cap-card-body relative flex flex-1 flex-col gap-3.5 p-4">
              <div
                className={cn(
                  'relative h-24 overflow-hidden rounded-md border border-[var(--tilery-panel-border,#2a2d33)] bg-[var(--tilery-bg,#0e0f12)] isolate scheme-dark',
                  demoClassMap[cap.demo],
                  cap.demo === 'styling' &&
                    'bg-[var(--tilery-panel-bg,#1a1c20)] border-[var(--tilery-accent,#a3e635)] border-2',
                )}>
                <CapDemo type={cap.demo} />
              </div>
              <p className="m-0 text-sm leading-normal text-[var(--tilery-tab-fg,#9aa1ab)]">
                {cap.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
