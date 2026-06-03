// "Stunt-double" Tilery pieces — purely presentational components that mimic the
// real engine's chrome (drop overlay, drag ghost, status bar) using the exact
// `--tilery-*` values from packages/core/src/tilery.css. Scenes choreograph
// these freely; the real engine is never driven by scroll/loops. The panel /
// tab-bar / tab / divider chrome is applied directly via the `home-*` classes
// in globals.css (see `/* Home — stunt-double kit */`), so only the overlay
// pieces and the status bar need dedicated components here.

import type { CSSProperties } from 'react';

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type BaseProps = {
  className?: string;
  style?: CSSProperties;
};

/** The signature blue drop-into-split overlay (mirrors .tilery__drop-overlay). */
export function HomeDropOverlay({
  className,
  style,
  zone,
}: BaseProps & { zone?: 'center' }) {
  return (
    <div
      className={cx('home-drop', zone === 'center' && 'home-drop--center', className)}
      style={style}
      data-zone={zone}
    />
  );
}

/** Floating pill that follows the cursor while "dragging" (mirrors .tilery__drag-ghost). */
export function HomeDragGhost({
  label,
  count,
  className,
  style,
}: BaseProps & { label: string; count?: number }) {
  return (
    <div className={cx('home-dragghost', className)} style={style}>
      <span>{label}</span>
      {count ? <span className="home-dragghost__count">+{count}</span> : null}
    </div>
  );
}

/** Ghost pointer used by the auto-play drag loop. */
export function HomeCursor({ className, style }: BaseProps) {
  return (
    <svg
      className={cx('home-cursor', className)}
      style={style}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true">
      <path
        d="M3.5 1.8l11.7 7.1-4.9 1.1 2.8 5.4-2.4 1.2-2.8-5.5-4.2 3.4z"
        fill="currentColor"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Slim faux status bar — the workspace's narrative HUD. */
export function HomeStatusBar({
  segments,
  pulse = false,
  className,
  style,
}: BaseProps & { segments: string[]; pulse?: boolean }) {
  return (
    <div className={cx('home-statusbar', className)} style={style}>
      <span
        className={cx('home-statusbar__dot', pulse && 'home-statusbar__dot--pulse')}
        aria-hidden="true"
      />
      {segments.map((seg, i) => (
        <span key={i} className="home-statusbar__seg">
          {seg}
        </span>
      ))}
    </div>
  );
}
