import type { Metadata } from 'next';
import { CodeBlock } from '../../components/ui/code-block';
import { PageNavigation } from '../../components/page-navigation';
import { DesignShowcase } from './design-showcase';
import styles from './design-page.module.css';

export const metadata: Metadata = {
  title: 'Design System',
  description:
    'Internal showcase of the reusable UI components and tokens used by the Tilery demo website.',
};

const designCodeSample = [
  'type DemoToken = {',
  '  name: string;',
  '  value: string;',
  '  usage: string;',
  '};',
  '',
  'export function TokenRow({ token }: { token: DemoToken }) {',
  '  return (',
  '    <div className="design-token">',
  '      <span className="design-token__swatch" />',
  '      <code>{token.name}</code>',
  '      <span>{token.usage}</span>',
  '    </div>',
  '  );',
  '}',
].join('\n');

export default async function DesignPage() {
  const codeBlock = await CodeBlock({
    code: designCodeSample,
    language: 'tsx',
  });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Demo design system</h1>
        <p className={styles.pageDescription}>
          A focused showcase for the demo website UI: tokens, controls, page
          chrome, examples, code blocks, and playground components.
        </p>
      </header>

      <DesignShowcase />

      <section className={styles.section} aria-labelledby="design-code-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-code-title">Code blocks</h2>
          <p>
            The docs and examples share the same highlighted frame, copy action,
            and long-code expansion treatment.
          </p>
        </div>
        <div className={styles.specimen + ' ' + styles['specimen--wide']}>
          {codeBlock}
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="design-navigation-title">
        <div className={styles.sectionHeader}>
          <h2 id="design-navigation-title">Page navigation</h2>
          <p>
            Previous and next links reuse the same component as guide, example,
            and reference pages.
          </p>
        </div>
        <div className={styles.specimen + ' ' + styles.pageNavSpecimen}>
          <PageNavigation
            previous={{ href: '/docs/styling', label: 'Styling' }}
            next={{ href: '/playground', label: 'Playground' }}
          />
        </div>
      </section>
    </div>
  );
}
