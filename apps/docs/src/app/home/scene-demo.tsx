'use client';

import { LiveIdeDemo } from '../home-demo';
import { cn } from '../../lib/cn';
import './home-demo.css';

export function DemoScene() {
  return (
    <section aria-labelledby="demo-title">
      <header className="flex max-w-none items-center justify-between gap-4">
        <h2
          id="demo-title"
          className="m-0 border-0 p-0 text-[clamp(24px,3.2vw,40px)] font-semibold leading-none tracking-tighter text-site-fg">
          Try it — resize, drag, drop.
        </h2>
      </header>
      <div
        className={cn(
          'home-demo-shell relative mt-6 flex flex-col text-base [&_.tilery]:text-base',
          'home-demo-reveal',
        )}
        style={
          {
            '--example-demo-bg': '#0e0f12',
            '--example-demo-fg': '#d9dde3',
            '--example-demo-fg-strong': '#f3f4f7',
            '--example-demo-muted': '#9aa1ab',
            '--example-demo-muted-soft': '#6f7785',
            '--example-demo-border': '#2a2d33',
            '--example-demo-border-soft': 'rgba(255, 255, 255, 0.08)',
            '--example-demo-panel-bg': '#111318',
            '--example-demo-panel-bg-raised': '#1f2127',
            '--example-demo-control-active-bg': 'rgba(255, 255, 255, 0.1)',
            '--example-demo-code-bg': '#101318',
            '--example-demo-meta-bg': 'rgba(255, 255, 255, 0.07)',
            '--tilery-bg': '#0e0f12',
            '--tilery-fg': '#d9dde3',
            '--tilery-panel-bg': '#1a1c20',
            '--tilery-panel-border': '#2a2d33',
            '--tilery-tabbar-bg': '#16181c',
            '--tilery-tab-fg': '#9aa1ab',
            '--tilery-tab-active-bg': '#1a1c20',
            '--tilery-tab-active-fg': '#f3f4f7',
            '--tilery-tab-hover-bg': 'rgba(255, 255, 255, 0.04)',
            '--tilery-menu-bg': '#1f2228',
            '--tilery-action-hover-bg': 'rgba(255, 255, 255, 0.08)',
            '--tilery-accent': 'var(--site-workspace-accent)',
            '--tilery-drop-bg':
              'color-mix(in srgb, var(--site-workspace-accent), transparent 82%)',
            '--tilery-drop-border':
              'color-mix(in srgb, var(--site-workspace-accent), transparent 28%)',
            '--tilery-resize-handle-active-bg':
              'color-mix(in srgb, var(--site-workspace-accent), transparent 38%)',
            '--home-demo-accent': 'var(--site-workspace-accent)',
            '--home-demo-drop-bg': 'var(--tilery-drop-bg)',
            '--home-demo-drop-border': 'var(--tilery-drop-border)',
          } as React.CSSProperties
        }>
        <LiveIdeDemo />
      </div>
    </section>
  );
}
