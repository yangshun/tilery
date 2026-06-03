import 'react';

// Allow CSS custom properties (e.g. `--reveal-i`) in inline `style` objects.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
