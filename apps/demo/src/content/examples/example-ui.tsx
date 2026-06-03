import type {
  ButtonHTMLAttributes,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from 'react';

type ExampleStackProps = PropsWithChildren<{
  rows?: string;
  style?: CSSProperties;
}>;

export function ExampleStack({
  children,
  rows = 'minmax(0, 1fr)',
  style,
}: ExampleStackProps) {
  return (
    <div style={{ ...stackStyle, gridTemplateRows: rows, ...style }}>
      {children}
    </div>
  );
}

type ExampleSectionProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
  frameStyle?: CSSProperties;
}>;

export function ExampleSection({
  title,
  description,
  actions,
  children,
  frameStyle,
}: ExampleSectionProps) {
  const hasHeader = title || description || actions;

  return (
    <section style={sectionStyle}>
      {hasHeader ? (
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleGroupStyle}>
            {title ? <div style={sectionTitleStyle}>{title}</div> : null}
            {description ? (
              <p style={sectionDescriptionStyle}>{description}</p>
            ) : null}
          </div>
          {actions ? <div style={sectionActionsStyle}>{actions}</div> : null}
        </div>
      ) : null}
      <div style={{ ...frameStyleBase, ...frameStyle }}>{children}</div>
    </section>
  );
}

type ExampleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function ExampleButton({
  active = false,
  style,
  ...props
}: ExampleButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...buttonStyle,
        background: active ? 'rgba(255, 255, 255, 0.1)' : '#1f2127',
        color: active ? '#f3f4f7' : '#d9dde3',
        ...style,
      }}
    />
  );
}

type EmptyStateProps = {
  children: ReactNode;
};

export function EmptyState({ children }: EmptyStateProps) {
  return <div style={emptyStateStyle}>{children}</div>;
}

type TabContentProps = PropsWithChildren<{
  meta?: string;
}>;

export function TabContent({ meta, children }: TabContentProps) {
  return (
    <div style={tabContentStyle}>
      {meta ? <div style={tabMetaStyle}>{meta}</div> : null}
      <div style={tabBodyStyle}>{children}</div>
    </div>
  );
}

export const stackStyle: CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'grid',
  gap: 12,
  background: '#0e0f12',
};

export const sectionStyle: CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 16,
};

export const sectionHeaderStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 18,
};

export const sectionTitleGroupStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 5,
};

export const sectionTitleStyle: CSSProperties = {
  color: '#f3f4f7',
  fontSize: 15,
  fontWeight: 650,
};

export const sectionDescriptionStyle: CSSProperties = {
  margin: 0,
  color: '#8f98a6',
  fontSize: 14,
  lineHeight: 1.35,
};

export const sectionActionsStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 6,
};

export const frameStyleBase: CSSProperties = {
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  border: '1px solid #2a2d33',
  borderRadius: 6,
  background: '#111318',
};

export const buttonStyle: CSSProperties = {
  minHeight: 26,
  padding: '0 9px',
  border: '1px solid #2a2d33',
  borderRadius: 4,
  fontSize: 13,
  cursor: 'pointer',
};

export const emptyStateStyle: CSSProperties = {
  color: '#6f7785',
  fontSize: 13,
};

export const tabContentStyle: CSSProperties = {
  height: '100%',
  padding: 16,
  color: '#9aa1ab',
  fontSize: 15,
  lineHeight: 1.5,
};

export const tabMetaStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  marginBottom: 10,
  padding: '3px 7px',
  borderRadius: 4,
  background: 'rgba(255, 255, 255, 0.07)',
  color: '#9aa1ab',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

export const tabBodyStyle: CSSProperties = {
  maxWidth: 560,
};
