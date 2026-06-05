import type { Metadata } from 'next';
import Script from 'next/script';
import '@tilery/react/style.css';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { siteNavigationGroups } from '../content/navigation';

export const metadata: Metadata = {
  title: {
    default: 'Tilery',
    template: '%s | Tilery',
  },
  description: 'A tiling panel layout engine for React',
};

// Runs before paint to set the theme from a saved choice or the system
// preference, avoiding a flash of the wrong theme. Kept inline and minimal.
const themeScript = `(function(){try{var t=localStorage.getItem('tilery-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;var a=localStorage.getItem('tilery-accent');if(a==='rose'){a='red';}if(!/^(lime|teal|sky|red|orange|purple|amber|white)$/.test(a||'')){a='lime';}document.documentElement.dataset.accent=a;}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.dataset.accent='lime';}})();`;

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
        <div className="site-layout">
          <div className="sidebar-container">
            <Sidebar groups={siteNavigationGroups} />
          </div>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
