import './home-principles.css';

const workspaceTabs = ['app.tsx', 'preview', 'terminal'];

export function HeroPrinciplesVisual() {
  return (
    <div
      className="hero-principles absolute z-1 top-[clamp(8px,2vh,24px)] right-[clamp(40px,6vw,84px)] w-[min(810px,67.5vw)] h-[clamp(378px,41.4vw,504px)] pointer-events-none"
      style={
        {
          '--tilery-panel-bg': '#111318',
          '--tilery-tab-active-bg': '#111318',
          '--tilery-tabbar-bg': '#0d0f13',
        } as React.CSSProperties
      }
      aria-hidden="true">
      <div className="principles-visual relative isolate h-full [color-scheme:dark]">
        <div className="relative z-1 h-full">
          <div className="pp-workspace flex gap-1.5 h-full overflow-hidden rounded-[6px] border border-site-shell-border bg-[var(--tilery-bg,#0e0f12)] py-2.5 pl-2.5 pr-4">
            <div
              className="pp-a flex min-w-0 flex-col overflow-hidden rounded-none border-0 bg-[var(--tilery-panel-bg,#1a1c20)] text-[var(--tilery-fg,#d9dde3)]"
              style={{ flex: '0 0 100%' }}>
              <div className="flex flex-none items-stretch h-[var(--tilery-tabbar-height,32px)] bg-[var(--tilery-tabbar-bg,#16181c)] border-b border-[var(--tilery-panel-border,#2a2d33)]">
                <div className="pp-tab--active relative inline-flex flex-none items-center gap-2 max-w-[180px] px-3 h-full text-[var(--tilery-tab-font-size,12px)] border-r border-[var(--tilery-panel-border,#2a2d33)] rounded-t-[5px] whitespace-nowrap bg-[var(--tilery-tab-active-bg,var(--tilery-panel-bg,#1a1c20))] text-[var(--tilery-tab-active-fg,#f3f4f7)]">
                  <span className="overflow-hidden text-ellipsis">
                    {workspaceTabs[0]}
                  </span>
                </div>
              </div>
              <div className="pp-body pp-body--a overflow-hidden px-[22px] py-5">
                <pre className="pp-code m-0 overflow-hidden border-0 rounded-none bg-transparent font-mono text-[clamp(10px,1.05vw,12px)] leading-[1.65] text-[#6f7784] whitespace-pre-wrap p-0">
                  {`export function AppShell() {
  const layout = useWorkspaceLayout();

  return (
    <Tilery
      initialLayout={layout}
      renderTabHeader={renderTab}
      renderTabContent={renderPanel}
    />
  );
}`}
                </pre>
              </div>
            </div>

            <div
              className="pp-b flex min-w-0 flex-col gap-1.5 overflow-hidden opacity-0"
              style={{ flex: '0 0 0%' }}>
              <div className="home-pp__panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-[var(--tilery-panel-bg,#1a1c20)] text-[var(--tilery-fg,#d9dde3)]">
                <div className="flex flex-none items-stretch h-[var(--tilery-tabbar-height,32px)] bg-[var(--tilery-tabbar-bg,#16181c)] border-b border-[var(--tilery-panel-border,#2a2d33)]">
                  <div className="pp-tab--active relative inline-flex flex-none items-center gap-2 max-w-[180px] px-3 h-full text-[var(--tilery-tab-font-size,12px)] border-r border-[var(--tilery-panel-border,#2a2d33)] rounded-t-[5px] whitespace-nowrap bg-[var(--tilery-tab-active-bg,var(--tilery-panel-bg,#1a1c20))] text-[var(--tilery-tab-active-fg,#f3f4f7)]">
                    <span className="overflow-hidden text-ellipsis">
                      {workspaceTabs[1]}
                    </span>
                  </div>
                </div>
                <div className="pp-body pp-body--b overflow-hidden px-[22px] py-5 max-lg:p-[15px]">
                  <div className="pp-preview flex h-full min-w-[190px] max-w-full flex-col gap-3.5 overflow-hidden text-[#6f7784] text-xs max-lg:min-w-0 max-lg:gap-2 max-lg:text-[11px]">
                    <div className="pp-preview-pane flex min-w-0 min-h-0 flex-1 flex-col gap-2 justify-end overflow-hidden max-lg:gap-[5px]">
                      <strong className="max-w-full overflow-hidden text-[#8d96a4] text-[13px] text-ellipsis whitespace-nowrap max-lg:text-xs">
                        Project dashboard
                      </strong>
                      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        5 open tabs
                      </span>
                      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        Layout saved 2m ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="pp-term-wrap flex min-h-0 overflow-hidden opacity-0"
                style={{ flex: '0 0 0%' }}>
                <div className="home-pp__panel flex w-full flex-1 flex-col overflow-hidden rounded-none border-0 bg-[var(--tilery-panel-bg,#1a1c20)] text-[var(--tilery-fg,#d9dde3)]">
                  <div className="flex flex-none items-stretch h-[var(--tilery-tabbar-height,32px)] bg-[var(--tilery-tabbar-bg,#16181c)] border-b border-[var(--tilery-panel-border,#2a2d33)]">
                    <div className="pp-tab--active relative inline-flex flex-none items-center gap-2 max-w-[180px] px-3 h-full text-[var(--tilery-tab-font-size,12px)] border-r border-[var(--tilery-panel-border,#2a2d33)] rounded-t-[5px] whitespace-nowrap bg-[var(--tilery-tab-active-bg,var(--tilery-panel-bg,#1a1c20))] text-[var(--tilery-tab-active-fg,#f3f4f7)]">
                      <span className="overflow-hidden text-ellipsis">
                        {workspaceTabs[2]}
                      </span>
                    </div>
                  </div>
                  <div className="pp-body pp-body--c overflow-hidden px-[22px] py-5 max-lg:p-[15px]">
                    <pre className="pp-terminal-text m-0 overflow-hidden border-0 rounded-none bg-transparent font-mono text-[clamp(10px,1.05vw,12px)] leading-[1.65] text-[#6f7784] whitespace-pre-wrap p-0 max-lg:text-[10px] max-lg:leading-[1.5]">
                      {
                        '$ pnpm dev\nready - started server\ncompiled /workspace in 184ms'
                      }
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
