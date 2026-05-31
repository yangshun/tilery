import Link from 'next/link';
import { HomeDemo } from './home-demo';

const principles = [
  {
    title: 'A real workspace surface',
    body: 'Drag tabs, split panels, and resize complex arrangements without building your own window manager.',
  },
  {
    title: 'State that follows the work',
    body: 'Stable portal hosts keep React subtrees alive as tabs move, so forms, editors, and previews do not reset.',
  },
  {
    title: 'Programmable by default',
    body: 'Use typed handles to create panels, move tabs, activate views, persist layouts, and build your own controls.',
  },
];

const capabilities = [
  [
    'Tab movement',
    'Reorder tabs, move them across panels, or drop them into new split zones.',
  ],
  [
    'Resize model',
    'Dividers and junction handles are derived from layout geometry automatically.',
  ],
  [
    'Rendering control',
    'Bring your own tab headers, panel content, icons, and interaction chrome.',
  ],
  [
    'Styling system',
    'Tune the default surface with CSS variables instead of replacing the whole renderer.',
  ],
  [
    'Core package',
    'Keep state and layout operations framework-agnostic, with React as the first adapter.',
  ],
  [
    'Imperative API',
    'Split, append, insert, remove, activate, swap, and inspect layouts from product code.',
  ],
];

const links = [
  ['Getting Started', '/docs/getting-started'],
  ['Concepts', '/docs/concepts'],
  ['API Reference', '/docs/api'],
  ['Examples', '/examples/ide'],
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Build IDE-like tiled interfaces in React.</h1>
        <p className="home-hero__lead">
          A layout engine for draggable tabs, resizable panels, preserved React
          state, and programmable workspaces.
        </p>
        <div className="home-actions">
          <Link
            className="home-button home-button--primary"
            href="/docs/getting-started">
            Start building
          </Link>
          <Link
            className="home-button home-button--secondary"
            href="/examples/ide">
            Open the IDE example
          </Link>
        </div>
      </section>

      <section className="home-product" aria-label="Interactive Tilery demo">
        <div className="home-product__intro">
          <p>
            The live preview is the product surface: drag tabs, resize panels,
            and split layouts directly in the workspace.
          </p>
        </div>
        <HomeDemo />
      </section>

      <section
        className="home-principles"
        aria-label="Tilery design principles">
        {principles.map((item) => (
          <article key={item.title} className="home-principle">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section
        className="home-capabilities"
        aria-labelledby="capabilities-title">
        <div>
          <h2 id="capabilities-title">The primitives for panel-based apps.</h2>
        </div>
        <dl className="home-capability-list">
          {capabilities.map(([title, body]) => (
            <div key={title} className="home-capability">
              <dt>{title}</dt>
              <dd>{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="home-next" aria-labelledby="next-title">
        <h2 id="next-title">Go deeper.</h2>
        <div className="home-link-strip">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
