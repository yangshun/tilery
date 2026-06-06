// Autonomous hero background visual. The motion is CSS-only so it can fade in
// and keep running without binding to scroll progress.

const workspaceTabs = ['app.tsx', 'preview', 'terminal'];

export function HeroPrinciplesVisual() {
  return (
    <div className="home-hero__principles" aria-hidden="true">
      <div className="home-principles-visual">
        <div className="home-principles-visual__stage">
          <div className="home-principles__row home-workspace">
            <div className="home-panel home-pp__panel home-pp__a">
              <div className="home-tabbar">
                <div className="home-tab home-tab--active">
                  <span className="home-tab__label">{workspaceTabs[0]}</span>
                </div>
              </div>
              <div className="home-pp__body home-pp__body--a">
                <pre className="home-pp-code">
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

            <div className="home-pp__b">
              <div className="home-panel home-pp__panel home-pp__editor">
                <div className="home-tabbar">
                  <div className="home-tab home-tab--active">
                    <span className="home-tab__label">{workspaceTabs[1]}</span>
                  </div>
                </div>
                <div className="home-pp__body home-pp__body--b">
                  <div className="home-pp-preview">
                    <div className="home-pp-preview__pane">
                      <strong>Project dashboard</strong>
                      <span>5 open tabs</span>
                      <span>Layout saved 2m ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="home-pp__term-wrap">
                <div className="home-panel home-pp__panel home-pp__terminal">
                  <div className="home-tabbar">
                    <div className="home-tab home-tab--active">
                      <span className="home-tab__label">
                        {workspaceTabs[2]}
                      </span>
                    </div>
                  </div>
                  <div className="home-pp__body home-pp__body--c">
                    <pre className="home-pp-terminal-text">
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
