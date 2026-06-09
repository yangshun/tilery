import type { Metadata } from 'next';
import { CodeBlock } from '../../components/ui/code-block';
import { PageNavigation } from '../../components/page-navigation';
import { DesignShowcase } from './design-showcase';

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
    <div className="max-w-[1180px] mx-auto px-12 py-10 pb-[72px] max-lg:px-[18px] max-lg:py-7 max-lg:pb-[52px]">
      <header className="max-w-[760px] mb-12 max-lg:mb-9">
        <h1>Demo design system</h1>
        <p className="max-w-[720px] m-0 text-site-fg-soft text-base leading-[1.65]">
          A focused showcase for the demo website UI: tokens, controls, page
          chrome, examples, code blocks, and playground components.
        </p>
      </header>

      <DesignShowcase />

      <section
        className="mt-[72px] max-lg:mt-11"
        aria-labelledby="design-code-title">
        <div className="max-w-[760px] mb-[18px]">
          <h2 className="mt-0 mb-1" id="design-code-title">
            Code blocks
          </h2>
          <p className="m-0 text-site-muted text-[15px] leading-[1.6]">
            The docs and examples share the same highlighted frame, copy action,
            and long-code expansion treatment.
          </p>
        </div>
        <div className="design-specimen design-specimen--wide min-w-0 grid gap-[18px] p-[18px] rounded-lg bg-site-overlay-weak max-lg:p-3.5">
          {codeBlock}
        </div>
      </section>

      <section
        className="mt-[72px] max-lg:mt-11"
        aria-labelledby="design-navigation-title">
        <div className="max-w-[760px] mb-[18px]">
          <h2 className="mt-0 mb-1" id="design-navigation-title">
            Page navigation
          </h2>
          <p className="m-0 text-site-muted text-[15px] leading-[1.6]">
            Previous and next links reuse the same component as guide, example,
            and reference pages.
          </p>
        </div>
        <div className="design-page-nav-specimen min-w-0 grid gap-[18px] p-[18px] rounded-lg bg-site-overlay-weak max-lg:p-3.5">
          <PageNavigation
            previous={{ href: '/docs/styling', label: 'Styling' }}
            next={{ href: '/playground', label: 'Playground' }}
          />
        </div>
      </section>
    </div>
  );
}
