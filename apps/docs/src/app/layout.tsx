import type { Metadata } from 'next';
import Script from 'next/script';
import '@tileryjs/react/style.css';
import '@fontsource-variable/mona-sans';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { SidebarContainer } from '../components/sidebar-container';
import {
  ACCENT_CSS,
  ACCENT_IDS_PATTERN,
  ACCENT_MIGRATIONS,
  DEFAULT_ACCENT,
  STORAGE_KEY as ACCENT_STORAGE_KEY,
} from '../content/accents';
import {
  playgroundNavigationItem,
  siteNavigationGroups,
} from '../content/navigation';

export const metadata: Metadata = {
  title: {
    default: 'Tilery',
    template: '%s | Tilery',
  },
  description: 'A framework-agnostic panel layout engine with a React adapter.',
};

// Runs before paint to set the theme from a saved choice or the system
// preference, avoiding a flash of the wrong theme. Kept inline and minimal.
const themeScript = `(function(){try{var t=localStorage.getItem('tilery-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});var m=${JSON.stringify(ACCENT_MIGRATIONS)};a=m[a]||a;if(!/^(${ACCENT_IDS_PATTERN})$/.test(a||'')){a=${JSON.stringify(DEFAULT_ACCENT)};}document.documentElement.dataset.accent=a;}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.dataset.accent=${JSON.stringify(DEFAULT_ACCENT)};}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="tilery-theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <style
          id="tilery-accent-tokens"
          dangerouslySetInnerHTML={{ __html: ACCENT_CSS }}
        />
        <div className="flex h-screen overflow-hidden bg-site-bg max-lg:min-h-screen max-lg:h-auto max-lg:overflow-visible max-lg:flex-col">
          <SidebarContainer className="shrink-0 w-[calc(var(--site-sidebar-width)+30px)] p-2.5 max-lg:w-auto max-lg:px-5 max-lg:py-2.5 max-lg:sticky max-lg:top-0 max-lg:z-10">
            <Sidebar
              groups={siteNavigationGroups}
              utilityItem={playgroundNavigationItem}
            />
          </SidebarContainer>
          <main
            className="site-main relative flex-1 min-w-0 overflow-y-auto max-lg:overflow-visible"
            data-scroll-root>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
