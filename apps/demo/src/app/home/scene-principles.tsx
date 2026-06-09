import { cn } from '../../lib/cn';
import styles from './home-principles.module.css';

const workspaceTabs = ['app.tsx', 'preview', 'terminal'];

export function HeroPrinciplesVisual() {
  return (
    <div className={styles.heroPrinciples} aria-hidden="true">
      <div className={styles.principlesVisual}>
        <div className={styles.principlesVisualStage}>
          <div className={cn(styles.principlesRow, styles.workspace)}>
            <div className={cn(styles.panel, 'home-pp__panel', styles.pp__a)}>
              <div className={styles.tabbar}>
                <div className={cn(styles.tab, styles['tab--active'])}>
                  <span className={styles.tabLabel}>{workspaceTabs[0]}</span>
                </div>
              </div>
              <div className={cn(styles.pp__body, styles['pp__body--a'])}>
                <pre className={styles.ppCode}>
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

            <div className={styles.pp__b}>
              <div
                className={cn(
                  styles.panel,
                  'home-pp__panel',
                  styles.pp__editor,
                )}>
                <div className={styles.tabbar}>
                  <div className={cn(styles.tab, styles['tab--active'])}>
                    <span className={styles.tabLabel}>{workspaceTabs[1]}</span>
                  </div>
                </div>
                <div className={cn(styles.pp__body, styles['pp__body--b'])}>
                  <div className={styles.ppPreview}>
                    <div className={styles.ppPreviewPane}>
                      <strong>Project dashboard</strong>
                      <span>5 open tabs</span>
                      <span>Layout saved 2m ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.pp__termWrap}>
                <div
                  className={cn(
                    styles.panel,
                    'home-pp__panel',
                    styles.pp__terminal,
                  )}>
                  <div className={styles.tabbar}>
                    <div className={cn(styles.tab, styles['tab--active'])}>
                      <span className={styles.tabLabel}>
                        {workspaceTabs[2]}
                      </span>
                    </div>
                  </div>
                  <div className={cn(styles.pp__body, styles['pp__body--c'])}>
                    <pre className={styles.ppTerminalText}>
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
