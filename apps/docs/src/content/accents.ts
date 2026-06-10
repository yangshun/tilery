// Source of truth for the demo site's accent palette. The corresponding
// `--site-accent`, `--site-link-hover`, and `--site-nav-hover-border` values
// for both themes are emitted at runtime in `app/layout.tsx`; the dark
// `--site-workspace-accent` mirrors `dark.accent`.

type AccentTheme = {
  /** `--site-accent` value. */
  accent: string;
  /** `--site-link-hover` value. */
  linkHover: string;
  /** `--site-nav-hover-border` value. */
  navHoverBorder: string;
};

type AccentShape = {
  id: string;
  label: string;
  dark: AccentTheme;
  light: AccentTheme;
};

export const ACCENTS = [
  {
    id: 'red',
    label: 'Red',
    dark: {
      accent: '#ff2d2d',
      linkHover: '#ff6b6b',
      navHoverBorder: 'rgba(255, 45, 45, 0.58)',
    },
    light: {
      accent: '#dc2626',
      linkHover: '#b91c1c',
      navHoverBorder: 'rgba(220, 38, 38, 0.48)',
    },
  },
  {
    id: 'orange',
    label: 'Orange',
    dark: {
      accent: '#f97316',
      linkHover: '#fb923c',
      navHoverBorder: 'rgba(249, 115, 22, 0.56)',
    },
    light: {
      accent: '#c2410c',
      linkHover: '#9a3412',
      navHoverBorder: 'rgba(194, 65, 12, 0.46)',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    dark: {
      accent: '#fbbf24',
      linkHover: '#fcd34d',
      navHoverBorder: 'rgba(251, 191, 36, 0.56)',
    },
    light: {
      accent: '#b45309',
      linkHover: '#92400e',
      navHoverBorder: 'rgba(180, 83, 9, 0.46)',
    },
  },
  {
    id: 'lime',
    label: 'Lime',
    dark: {
      accent: '#a3e635',
      linkHover: '#bef264',
      navHoverBorder: 'rgba(163, 230, 53, 0.56)',
    },
    light: {
      accent: '#4d7c0f',
      linkHover: '#3f6212',
      navHoverBorder: 'rgba(77, 124, 15, 0.5)',
    },
  },
  {
    id: 'teal',
    label: 'Teal',
    dark: {
      accent: '#2dd4bf',
      linkHover: '#5eead4',
      navHoverBorder: 'rgba(45, 212, 191, 0.56)',
    },
    light: {
      accent: '#0f766e',
      linkHover: '#115e59',
      navHoverBorder: 'rgba(15, 118, 110, 0.48)',
    },
  },
  {
    id: 'sky',
    label: 'Sky',
    dark: {
      accent: '#38bdf8',
      linkHover: '#7dd3fc',
      navHoverBorder: 'rgba(56, 189, 248, 0.56)',
    },
    light: {
      accent: '#0369a1',
      linkHover: '#075985',
      navHoverBorder: 'rgba(3, 105, 161, 0.48)',
    },
  },
  {
    id: 'purple',
    label: 'Purple',
    dark: {
      accent: '#a855f7',
      linkHover: '#c084fc',
      navHoverBorder: 'rgba(168, 85, 247, 0.56)',
    },
    light: {
      accent: '#7e22ce',
      linkHover: '#6b21a8',
      navHoverBorder: 'rgba(126, 34, 206, 0.48)',
    },
  },
  {
    id: 'white',
    label: 'White',
    dark: {
      accent: '#f8fafc',
      linkHover: '#ffffff',
      navHoverBorder: 'rgba(248, 250, 252, 0.56)',
    },
    light: {
      accent: '#111827',
      linkHover: '#374151',
      navHoverBorder: 'rgba(17, 24, 39, 0.44)',
    },
  },
] as const satisfies readonly AccentShape[];

export type Accent = (typeof ACCENTS)[number];

export type AccentId = Accent['id'];

export const ACCENT_IDS: readonly AccentId[] = ACCENTS.map(
  (accent) => accent.id,
);

export const STORAGE_KEY = 'tilery-accent';

export const DEFAULT_ACCENT: AccentId = 'lime';

/** Renamed accent ids from previous versions, applied during boot. */
export const ACCENT_MIGRATIONS: Readonly<Record<string, AccentId>> = {
  rose: 'red',
};

/** Source string for an alternation regex matching every accent id. */
export const ACCENT_IDS_PATTERN: string = ACCENT_IDS.join('|');

export function isAccentId(
  value: string | undefined | null,
): value is AccentId {
  if (value == null) return false;
  return (ACCENT_IDS as readonly string[]).includes(value);
}

/** CSS that wires each accent's tokens to its `[data-accent]` attribute. */
export const ACCENT_CSS: string = (() => {
  const lines: string[] = [];
  for (const accent of ACCENTS) {
    lines.push(`:root[data-accent='${accent.id}'] {`);
    lines.push(`  --site-accent: ${accent.dark.accent};`);
    lines.push(`  --site-workspace-accent: ${accent.dark.accent};`);
    lines.push(`  --site-link-hover: ${accent.dark.linkHover};`);
    lines.push(`  --site-nav-hover-border: ${accent.dark.navHoverBorder};`);
    lines.push(`}`);
    lines.push(`:root[data-theme='light'][data-accent='${accent.id}'] {`);
    lines.push(`  --site-accent: ${accent.light.accent};`);
    lines.push(`  --site-link-hover: ${accent.light.linkHover};`);
    lines.push(`  --site-nav-hover-border: ${accent.light.navHoverBorder};`);
    lines.push(`}`);
  }
  return lines.join('\n');
})();
